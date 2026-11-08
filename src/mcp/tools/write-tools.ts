import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/server";
import { STATUS_LABEL } from "@/lib/constants";
import { formatTz } from "@/lib/dates";
import { formatBytes } from "@/lib/utils";
import { checkStorageLimit } from "@/features/videos/storage-limit";
import type { Database } from "@/types/database";
import {
  defaultStatus,
  duplicateKey,
  fieldsShape,
  normalizeHashtags,
  optionalText,
  resolveAccount,
  scheduledISO,
  videoItemSchema,
} from "../input";
import { enqueue, hasActiveJob, listJobs, reservedBytes } from "../upload-queue";
import { requireMcpUser } from "../session";
import { accountLabel, inspectVideoFile, loadAccounts, safely, videoLink, type AccountInfo, type InspectedFile } from "./shared";

type VideoInsert = Database["public"]["Tables"]["videos"]["Insert"];
type VideoUpdate = Database["public"]["Tables"]["videos"]["Update"];

function when(iso: string | null): string {
  return iso ? formatTz(iso, "EEE dd/MM HH:mm") : "sem data";
}

export function registerWriteTools(server: McpServer) {
  server.registerTool(
    "criar_videos",
    {
      title: "Criar vídeos no calendário",
      description: [
        "Cria de 1 a 50 vídeos no ViralLab de uma vez, já com legenda, hashtags e data, e envia os arquivos ao storage em segundo plano.",
        "Antes de chamar, mostre ao usuário a lista (conta, data/hora, título, legenda, hashtags, arquivo) e espere o OK.",
        "Valida tudo antes de criar qualquer coisa: se algum item tiver erro, nada é criado e os erros voltam por item.",
        "Repetir a chamada é seguro: vídeos com mesma conta, título e data já existentes são ignorados.",
        "Depois, use acompanhar_envios para conferir os uploads.",
      ].join(" "),
      inputSchema: z.object({
        videos: z.array(videoItemSchema).min(1).max(50).describe("Vídeos a criar. Para mais de 50, faça várias chamadas."),
      }),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ videos }) =>
      safely(async () => {
        const supabase = await requireMcpUser();
        const accounts = await loadAccounts(supabase);

        // 1. Valida todos os itens antes de criar qualquer coisa.
        const errors: string[] = [];
        const prepared: {
          index: number;
          account: AccountInfo;
          title: string;
          scheduledAt: string | null;
          file: InspectedFile | null;
          row: VideoInsert;
        }[] = [];

        for (const [i, item] of videos.entries()) {
          const n = i + 1;
          try {
            const account = resolveAccount(item.conta, accounts);
            const scheduledAt = item.agendado_para ? scheduledISO(item.agendado_para) : null;
            const file = item.arquivo ? await inspectVideoFile(item.arquivo) : null;
            const title = item.titulo.trim();
            prepared.push({
              index: n,
              account,
              title,
              scheduledAt,
              file,
              row: {
                account_id: account.id,
                title,
                caption: optionalText(item.legenda) ?? null,
                hashtags: normalizeHashtags(item.hashtags),
                scheduled_at: scheduledAt,
                status: item.status ?? defaultStatus(!!scheduledAt),
                notes: optionalText(item.notas) ?? null,
                source: "gerado",
              },
            });
          } catch (e) {
            errors.push(`#${n} "${item.titulo}": ${e instanceof Error ? e.message : String(e)}`);
          }
        }

        const files = prepared.flatMap((p) => (p.file ? [p.file.localPath] : []));
        const repeatedFiles = files.filter((f, i) => files.indexOf(f) !== i);
        if (repeatedFiles.length) errors.push(`O mesmo arquivo aparece em mais de um vídeo: ${[...new Set(repeatedFiles)].join(", ")}`);

        if (errors.length) {
          throw new Error(`Nada foi criado. Corrija e chame de novo:\n${errors.map((e) => `- ${e}`).join("\n")}`);
        }

        // 2. Ignora duplicatas (já existentes ou repetidas no próprio lote).
        const accountIds = [...new Set(prepared.map((p) => p.account.id))];
        const { data: existing, error: existingError } = await supabase
          .from("videos")
          .select("id, account_id, title, scheduled_at")
          .in("account_id", accountIds)
          .limit(10000);
        if (existingError) throw new Error(existingError.message);
        const seen = new Map(existing.map((v) => [duplicateKey(v.account_id, v.title, v.scheduled_at), v.id]));

        const skipped: string[] = [];
        const toCreate = prepared.filter((p) => {
          const key = duplicateKey(p.account.id, p.title, p.scheduledAt);
          const dup = seen.get(key);
          if (dup !== undefined) {
            skipped.push(`#${p.index} "${p.title}" (${accountLabel(p.account)}, ${when(p.scheduledAt)})${dup ? ` já existe: ${videoLink(dup)}` : " repetido no lote"}`);
            return false;
          }
          seen.set(key, "");
          return true;
        });

        if (toCreate.length === 0) {
          return `Nenhum vídeo novo: todos já existiam.\n${skipped.map((s) => `- ${s}`).join("\n")}`;
        }

        // 3. Teto de armazenamento para o lote inteiro (somando a fila em andamento).
        const newBytes = toCreate.reduce((s, p) => s + (p.file?.size ?? 0), 0);
        if (newBytes > 0) {
          const limitError = await checkStorageLimit(supabase, newBytes, reservedBytes());
          if (limitError) throw new Error(`Nada foi criado. ${limitError}.`);
        }

        // 4. Cria os cards de uma vez.
        const { data: created, error: insertError } = await supabase
          .from("videos")
          .insert(toCreate.map((p) => p.row))
          .select("id, account_id, title, scheduled_at");
        if (insertError) throw new Error(`Não foi possível criar os vídeos: ${insertError.message}`);
        const idByKey = new Map(created.map((v) => [duplicateKey(v.account_id, v.title, v.scheduled_at), v.id]));

        // 5. Coloca os arquivos na fila de envio.
        const lines: string[] = [];
        for (const p of toCreate) {
          const id = idByKey.get(duplicateKey(p.account.id, p.title, p.scheduledAt));
          if (!id) continue;
          if (p.file) {
            enqueue({
              videoId: id,
              accountId: p.account.id,
              title: p.title,
              accountLabel: accountLabel(p.account),
              localPath: p.file.localPath,
              displayPath: p.file.displayPath,
              size: p.file.size,
              mime: p.file.mime,
            });
          }
          const fileNote = p.file ? `arquivo na fila (${formatBytes(p.file.size)})` : "sem arquivo";
          lines.push(`- ${accountLabel(p.account)} · ${when(p.scheduledAt)} · ${p.title} [${STATUS_LABEL[p.row.status!]}, ${fileNote}] ${videoLink(id)}`);
        }

        const withFiles = toCreate.filter((p) => p.file).length;
        return [
          `${created.length} vídeo(s) criado(s) no calendário${withFiles ? `; ${withFiles} arquivo(s) (${formatBytes(newBytes)}) enviando em segundo plano` : ""}.`,
          ...lines,
          skipped.length ? `\nIgnorados por já existirem:\n${skipped.map((s) => `- ${s}`).join("\n")}` : "",
          withFiles ? "\nUse acompanhar_envios para ver o progresso. Mantenha o Claude Desktop aberto até terminar." : "",
        ]
          .filter(Boolean)
          .join("\n");
      }),
  );

  server.registerTool(
    "atualizar_video",
    {
      title: "Atualizar vídeo",
      description:
        "Altera um vídeo existente: título, legenda, hashtags, data, status ou notas. Com `arquivo`, anexa ou troca o vídeo (o anterior é apagado do storage depois do envio) — use também para repetir um envio que deu erro. Só os campos informados mudam.",
      inputSchema: z.object({
        id: z.uuid().describe("id do vídeo (aparece no link e em ver_agenda)."),
        ...{ ...fieldsShape, titulo: fieldsShape.titulo.optional() },
        remover_data: z.boolean().describe("true para tirar o vídeo do calendário (fica em \"Sem data\").").optional(),
      }),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async (input) =>
      safely(async () => {
        const supabase = await requireMcpUser();
        const { data: video, error } = await supabase
          .from("videos")
          .select("id, account_id, title, status, scheduled_at, account:accounts(platform, username)")
          .eq("id", input.id)
          .maybeSingle();
        if (error) throw new Error(error.message);
        if (!video) throw new Error(`Vídeo não encontrado: ${input.id}`);
        if (input.agendado_para && input.remover_data) throw new Error("Use agendado_para ou remover_data, não os dois.");

        const update: VideoUpdate = {};
        if (input.titulo !== undefined) update.title = input.titulo.trim();
        if (input.legenda !== undefined) update.caption = optionalText(input.legenda) ?? null;
        if (input.hashtags !== undefined) update.hashtags = normalizeHashtags(input.hashtags);
        if (input.notas !== undefined) update.notes = optionalText(input.notas) ?? null;
        if (input.agendado_para) update.scheduled_at = scheduledISO(input.agendado_para);
        if (input.remover_data) update.scheduled_at = null;

        if (input.status) update.status = input.status;
        else if (update.scheduled_at && (video.status === "gerado" || video.status === "aprovado")) update.status = "agendado";
        else if (update.scheduled_at === null && video.status === "agendado") update.status = "aprovado";

        let file: InspectedFile | null = null;
        if (input.arquivo) {
          if (hasActiveJob(video.id)) throw new Error("Já existe um envio em andamento para este vídeo. Veja acompanhar_envios.");
          file = await inspectVideoFile(input.arquivo);
          const limitError = await checkStorageLimit(supabase, file.size, reservedBytes());
          if (limitError) throw new Error(`${limitError}.`);
        }

        if (Object.keys(update).length === 0 && !file) return "Nada para alterar: informe ao menos um campo.";

        let current = video;
        if (Object.keys(update).length) {
          const { data: saved, error: saveError } = await supabase
            .from("videos")
            .update(update)
            .eq("id", video.id)
            .select("id, account_id, title, status, scheduled_at, account:accounts(platform, username)")
            .single();
          if (saveError) throw new Error(`Não foi possível salvar: ${saveError.message}`);
          current = saved;
        }

        const label = current.account ? accountLabel(current.account) : "";
        if (file) {
          enqueue({
            videoId: current.id,
            accountId: current.account_id,
            title: current.title,
            accountLabel: label,
            localPath: file.localPath,
            displayPath: file.displayPath,
            size: file.size,
            mime: file.mime,
          });
        }
        return [
          `Vídeo atualizado: ${label} · ${when(current.scheduled_at)} · ${current.title} [${STATUS_LABEL[current.status]}]`,
          file ? `Arquivo ${file.displayPath} (${formatBytes(file.size)}) na fila de envio.` : null,
          videoLink(current.id),
        ]
          .filter(Boolean)
          .join("\n");
      }),
  );

  server.registerTool(
    "acompanhar_envios",
    {
      title: "Acompanhar envios",
      description:
        "Mostra o andamento dos uploads de arquivos desta sessão do Claude Desktop: pendentes, enviando (com %), concluídos e com erro. Para repetir um envio com erro, chame atualizar_video com o id e o mesmo arquivo.",
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async () =>
      safely(async () => {
        const jobs = listJobs();
        if (jobs.length === 0) return "Nenhum envio nesta sessão.";
        const count = (s: string) => jobs.filter((j) => j.state === s).length;
        const sent = jobs.reduce((s, j) => s + (j.state === "concluido" ? j.size : Math.min(j.sent, j.size)), 0);
        const total = jobs.reduce((s, j) => s + j.size, 0);
        const lines = jobs.map((j) => {
          const pct = j.size ? Math.floor((Math.min(j.sent, j.size) / j.size) * 100) : 0;
          const state =
            j.state === "enviando" ? `enviando ${pct}%` : j.state === "erro" ? `erro: ${j.error}` : j.state === "concluido" ? "concluído" : "na fila";
          return `- ${j.accountLabel} · ${j.title} · ${formatBytes(j.size)} · ${state} (id ${j.videoId})`;
        });
        return [
          `Concluídos ${count("concluido")} de ${jobs.length} · enviando ${count("enviando")} · na fila ${count("pendente")} · erros ${count("erro")} · ${formatBytes(sent)} de ${formatBytes(total)}`,
          ...lines,
        ].join("\n");
      }),
  );
}
