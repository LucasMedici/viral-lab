import fs from "node:fs";
import https from "node:https";
import path from "node:path";
import { storage, videoObjectKey } from "@/lib/storage";
import { requireMcpUser } from "./session";

/**
 * Fila de envios do MCP: os cards são criados na hora e os arquivos sobem ao
 * storage em segundo plano (3 por vez). Assim uma chamada de ferramenta nunca
 * fica minutos esperando centenas de MB, e o Claude acompanha por `acompanhar_envios`.
 * A fila vive enquanto o Claude Desktop estiver aberto.
 */

export type UploadState = "pendente" | "enviando" | "concluido" | "erro";

export type UploadJob = {
  videoId: string;
  accountId: string;
  title: string;
  accountLabel: string;
  localPath: string;
  displayPath: string;
  size: number;
  mime: string;
  state: UploadState;
  sent: number;
  error?: string;
  queuedAt: Date;
  finishedAt?: Date;
};

const CONCURRENCY = 3;
const jobs: UploadJob[] = [];
let active = 0;

export function listJobs(): readonly UploadJob[] {
  return jobs;
}

/** Bytes aceitos que ainda não chegaram ao storage (contam no teto de armazenamento). */
export function reservedBytes(): number {
  return jobs.filter((j) => j.state === "pendente" || j.state === "enviando").reduce((s, j) => s + j.size, 0);
}

/** Há envio em andamento para este vídeo? (evita dois arquivos disputando o mesmo card) */
export function hasActiveJob(videoId: string): boolean {
  return jobs.some((j) => j.videoId === videoId && (j.state === "pendente" || j.state === "enviando"));
}

export function enqueue(job: Omit<UploadJob, "state" | "sent" | "queuedAt">) {
  jobs.push({ ...job, state: "pendente", sent: 0, queuedAt: new Date() });
  pump();
}

function pump() {
  while (active < CONCURRENCY) {
    const next = jobs.find((j) => j.state === "pendente");
    if (!next) return;
    next.state = "enviando";
    active++;
    run(next)
      .then(() => {
        next.state = "concluido";
      })
      .catch((e: unknown) => {
        next.state = "erro";
        next.error = e instanceof Error ? e.message : String(e);
        console.error(`[virallab-mcp] falha ao enviar "${next.title}":`, next.error);
      })
      .finally(() => {
        next.finishedAt = new Date();
        active--;
        pump();
      });
  }
}

async function run(job: UploadJob) {
  const supabase = await requireMcpUser();

  // O arquivo pode ter mudado desde a validação.
  const stat = await fs.promises.stat(job.localPath);
  if (stat.size !== job.size) job.size = stat.size;

  const { data: current, error: loadError } = await supabase
    .from("videos")
    .select("file_key, file_deleted_at")
    .eq("id", job.videoId)
    .maybeSingle();
  if (loadError || !current) throw new Error("O vídeo não existe mais no ViralLab.");

  const fileName = path.posix.basename(job.localPath);
  const key = videoObjectKey(job.accountId, fileName);
  const { url, headers } = await storage.createUploadUrl({ key, contentType: job.mime, size: job.size });
  await putFile(url, headers, job, (n) => {
    job.sent += n;
  });

  const { error } = await supabase
    .from("videos")
    .update({
      file_key: key,
      file_name: fileName,
      file_size_bytes: job.size,
      file_mime: job.mime,
      file_deleted_at: null,
    })
    .eq("id", job.videoId);
  if (error) {
    await storage.deleteObject(key).catch(() => {}); // não deixa arquivo órfão
    throw new Error(`Arquivo enviado, mas o card não foi atualizado: ${error.message}`);
  }

  // Troca de arquivo: remove o anterior para não ocupar espaço à toa.
  if (current.file_key && !current.file_deleted_at && current.file_key !== key) {
    await storage.deleteObject(current.file_key).catch((e) => console.error("[virallab-mcp] arquivo antigo não removido:", e));
  }
}

/** PUT por streaming na URL assinada (o arquivo não é carregado inteiro na memória). */
function putFile(url: string, headers: Record<string, string>, job: UploadJob, onProgress: (bytes: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const req = https.request(url, { method: "PUT", headers: { ...headers, "Content-Length": job.size } }, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (c: string) => {
        if (body.length < 500) body += c;
      });
      res.on("end", () => {
        if (res.statusCode && res.statusCode < 300) resolve();
        else reject(new Error(`O storage recusou o envio (HTTP ${res.statusCode}). ${body.slice(0, 200)}`.trim()));
      });
    });
    req.on("error", (e) => reject(new Error(`Falha de rede no envio: ${e.message}`)));
    req.setTimeout(10 * 60_000, () => req.destroy(new Error("Envio parado por mais de 10 minutos")));
    const stream = fs.createReadStream(job.localPath);
    stream.on("data", (chunk) => onProgress(chunk.length));
    stream.on("error", (e) => req.destroy(e));
    stream.pipe(req);
  });
}
