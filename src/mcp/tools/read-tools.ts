import fs from "node:fs";
import path from "node:path";
import { addDays } from "date-fns";
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/server";
import { STATUS_LABEL } from "@/lib/constants";
import { formatTz, parseDayKey, toUtcISO } from "@/lib/dates";
import { formatBytes } from "@/lib/utils";
import { resolveAccount } from "../input";
import { toDisplayPath, toLocalPath, videoMimeFor } from "../paths";
import { requireMcpUser } from "../session";
import { accountLabel, loadAccounts, safely } from "./shared";

const dayKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use AAAA-MM-DD");

export function registerReadTools(server: McpServer) {
  server.registerTool(
    "listar_contas",
    {
      title: "Listar contas",
      description:
        "Lista as contas cadastradas no ViralLab (TikTok, YouTube, Instagram) com id, @usuario, nome, nicho, descrição e vídeos pendentes. Use o nicho e a descrição como base para escrever legendas e hashtags no tom de cada conta.",
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async () =>
      safely(async () => {
        const accounts = await loadAccounts(await requireMcpUser());
        if (accounts.length === 0) return "Nenhuma conta cadastrada. Cadastre as contas no app antes de criar vídeos.";
        return accounts
          .map((a) =>
            [
              `- ${accountLabel(a)} · ${a.display_name}`,
              `  id: ${a.id}`,
              a.niche ? `  nicho: ${a.niche}` : null,
              a.description ? `  descrição: ${a.description}` : null,
              `  vídeos: ${a.video_count} (${a.pending_count} pendentes)`,
            ]
              .filter(Boolean)
              .join("\n"),
          )
          .join("\n");
      }),
  );

  server.registerTool(
    "ver_agenda",
    {
      title: "Ver agenda",
      description:
        "Mostra os vídeos agendados por conta e dia (horário de Brasília) e quantos estão sem data. Use antes de criar vídeos para escolher horários livres e não empilhar posts no mesmo horário.",
      inputSchema: z.object({
        conta: z.string().describe('Opcional: id ou "@usuario" para ver só uma conta.').optional(),
        de: dayKeySchema.describe("Primeiro dia (AAAA-MM-DD). Padrão: hoje.").optional(),
        ate: dayKeySchema.describe("Último dia, inclusive (AAAA-MM-DD). Padrão: 14 dias a partir de `de`.").optional(),
      }),
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ conta, de, ate }) =>
      safely(async () => {
        const supabase = await requireMcpUser();
        const accounts = await loadAccounts(supabase);
        const selected = conta ? [resolveAccount(conta, accounts)] : accounts;
        if (selected.length === 0) return "Nenhuma conta cadastrada.";

        const start = parseDayKey(de);
        const lastDay = ate ? parseDayKey(ate) : addDays(start, 13);
        const endExclusive = addDays(lastDay, 1);
        if (endExclusive <= start) throw new Error("`ate` precisa ser igual ou depois de `de`.");
        if (endExclusive.getTime() - start.getTime() > 93 * 86_400_000) throw new Error("Peça no máximo 3 meses por vez.");

        const ids = selected.map((a) => a.id);
        const [scheduled, unscheduled] = await Promise.all([
          supabase
            .from("videos")
            .select("id, account_id, title, status, scheduled_at, file_key, file_deleted_at")
            .in("account_id", ids)
            .gte("scheduled_at", toUtcISO(start))
            .lt("scheduled_at", toUtcISO(endExclusive))
            .order("scheduled_at")
            .limit(2000),
          supabase.from("videos").select("account_id").in("account_id", ids).is("scheduled_at", null).neq("status", "publicado"),
        ]);
        if (scheduled.error) throw new Error(scheduled.error.message);
        if (unscheduled.error) throw new Error(unscheduled.error.message);

        const range = `${formatTz(start, "dd/MM/yyyy")} a ${formatTz(lastDay, "dd/MM/yyyy")} (horário de Brasília)`;
        const blocks = selected.map((a) => {
          const items = scheduled.data.filter((v) => v.account_id === a.id);
          const semData = unscheduled.data.filter((v) => v.account_id === a.id).length;
          const lines = items.map((v) => {
            const file = !v.file_key ? "sem arquivo" : v.file_deleted_at ? "arquivo apagado" : "com arquivo";
            return `- ${formatTz(v.scheduled_at!, "EEE dd/MM HH:mm")} · ${v.title} [${STATUS_LABEL[v.status]}, ${file}] (id ${v.id})`;
          });
          return [
            `## ${accountLabel(a)} (id ${a.id})`,
            ...(lines.length ? lines : ["- nada agendado no período"]),
            `Sem data: ${semData}`,
          ].join("\n");
        });
        return [`Agenda de ${range}`, ...blocks].join("\n\n");
      }),
  );

  server.registerTool(
    "listar_arquivos_de_video",
    {
      title: "Listar arquivos de vídeo",
      description:
        "Lista os arquivos de vídeo (.mp4, .mov, .webm, .m4v) de uma pasta do PC com tamanho e data, em ordem de nome. Aceita caminhos do Windows (C:\\Users\\...). Use os caminhos devolvidos no campo `arquivo` de criar_videos.",
      inputSchema: z.object({
        pasta: z.string().min(1).describe("Caminho completo da pasta, ex.: C:\\Users\\voce\\Videos\\lote-novembro"),
        incluir_subpastas: z.boolean().describe("Procurar também em subpastas (até 3 níveis). Padrão: não.").optional(),
      }),
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ pasta, incluir_subpastas }) =>
      safely(async () => {
        const root = toLocalPath(pasta);
        const stat = await fs.promises.stat(root).catch(() => null);
        if (!stat?.isDirectory()) throw new Error(`Pasta não encontrada: ${toDisplayPath(root)}`);

        const found: { file: string; size: number; mtime: Date }[] = [];
        const LIMIT = 500;
        async function walk(dir: string, depth: number) {
          const entries = await fs.promises.readdir(dir, { withFileTypes: true });
          for (const entry of entries) {
            if (found.length >= LIMIT) return;
            if (entry.name.startsWith(".")) continue;
            const full = path.posix.join(dir, entry.name);
            if (entry.isDirectory()) {
              if (incluir_subpastas && depth < 3) await walk(full, depth + 1);
            } else if (entry.isFile() && videoMimeFor(full)) {
              const s = await fs.promises.stat(full);
              found.push({ file: full, size: s.size, mtime: s.mtime });
            }
          }
        }
        await walk(root, 0);

        if (found.length === 0) return `Nenhum vídeo em ${toDisplayPath(root)}.`;
        found.sort((a, b) => a.file.localeCompare(b.file, "pt-BR", { numeric: true }));
        const total = found.reduce((s, f) => s + f.size, 0);
        const lines = found.map((f) => `- ${toDisplayPath(f.file)} · ${formatBytes(f.size)} · ${formatTz(f.mtime, "dd/MM HH:mm")}`);
        const capped = found.length >= LIMIT ? `\n(lista cortada em ${LIMIT} arquivos)` : "";
        return `${found.length} vídeos, ${formatBytes(total)} no total:\n${lines.join("\n")}${capped}`;
      }),
  );
}
