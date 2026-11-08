import fs from "node:fs";
import { MAX_UPLOAD_BYTES, PLATFORM_LABEL, type Platform } from "@/lib/constants";
import { formatBytes } from "@/lib/utils";
import { toDisplayPath, toLocalPath, videoMimeFor } from "../paths";
import type { McpClient } from "../session";

export type ToolResult = { content: { type: "text"; text: string }[]; isError?: boolean };

/** Executa a ferramenta e transforma qualquer erro em resposta legível para o Claude. */
export async function safely(fn: () => Promise<string>): Promise<ToolResult> {
  try {
    return { content: [{ type: "text", text: await fn() }] };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[virallab-mcp]", message);
    return { content: [{ type: "text", text: message }], isError: true };
  }
}

export const APP_URL = (process.env.APP_URL || "http://localhost:3000").replace(/\/+$/, "");

export function videoLink(id: string): string {
  return `${APP_URL}/videos/${id}`;
}

export type AccountInfo = {
  id: string;
  platform: Platform;
  username: string;
  display_name: string;
  niche: string | null;
  description: string | null;
  pending_count: number;
  video_count: number;
};

export async function loadAccounts(supabase: McpClient): Promise<AccountInfo[]> {
  const { data, error } = await supabase
    .from("account_overview")
    .select("id, platform, username, display_name, niche, description, pending_count, video_count")
    .order("platform")
    .order("username");
  if (error) throw new Error(`Não foi possível carregar as contas: ${error.message}`);
  return data as AccountInfo[];
}

export function accountLabel(a: Pick<AccountInfo, "platform" | "username">): string {
  return `${PLATFORM_LABEL[a.platform]} @${a.username}`;
}

export type InspectedFile = { localPath: string; displayPath: string; size: number; mime: string };

/** Confere se o caminho é um arquivo de vídeo aceito e devolve tamanho e tipo. */
export async function inspectVideoFile(input: string): Promise<InspectedFile> {
  const localPath = toLocalPath(input);
  const displayPath = toDisplayPath(localPath);
  const mime = videoMimeFor(localPath);
  if (!mime) throw new Error(`${displayPath}: envie .mp4, .mov, .webm ou .m4v`);
  let stat: fs.Stats;
  try {
    stat = await fs.promises.stat(localPath);
  } catch {
    throw new Error(`${displayPath}: arquivo não encontrado`);
  }
  if (!stat.isFile()) throw new Error(`${displayPath}: não é um arquivo`);
  if (stat.size === 0) throw new Error(`${displayPath}: arquivo vazio`);
  if (stat.size > MAX_UPLOAD_BYTES) {
    throw new Error(`${displayPath}: ${formatBytes(stat.size)} passa do limite de ${formatBytes(MAX_UPLOAD_BYTES)} por arquivo`);
  }
  return { localPath, displayPath, size: stat.size, mime };
}
