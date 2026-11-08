import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { storageHardLimitBytes } from "@/lib/env";
import { storage } from "@/lib/storage";
import { storageLimitError } from "@/lib/storage/limit";
import type { Database } from "@/types/database";

/**
 * Regras de armazenamento compartilhadas entre o app (server actions) e o MCP.
 * Recebem o cliente do Supabase por parâmetro porque o MCP não tem os cookies do Next.
 */
type Client = SupabaseClient<Database>;

/** Soma dos arquivos ainda presentes no storage, pelo banco (grátis e instantâneo). */
export async function sumStoredBytes(supabase: Client): Promise<{ bytes: number; files: number }> {
  const { data, error } = await supabase
    .from("videos")
    .select("file_size_bytes")
    .is("file_deleted_at", null)
    .not("file_key", "is", null);
  if (error) throw new Error(error.message);
  return { bytes: data.reduce((sum, v) => sum + (v.file_size_bytes ?? 0), 0), files: data.length };
}

/**
 * Recusa o envio se o uso atual + `newBytes` passar do teto do app.
 * Usa o maior valor entre o banco e a listagem real do bucket, para contar
 * também arquivos que subiram mas não viraram vídeo (1 operação Classe A).
 * `reservedBytes` soma envios já aceitos que ainda não terminaram (fila do MCP).
 */
export async function checkStorageLimit(
  supabase: Client,
  newBytes: number,
  reservedBytes = 0,
): Promise<string | null> {
  let used = (await sumStoredBytes(supabase)).bytes;
  try {
    used = Math.max(used, (await storage.getBucketUsage()).bytes);
  } catch (e) {
    console.error("Não foi possível listar o bucket; usando o valor do banco.", e);
  }
  return storageLimitError(used + reservedBytes, newBytes, storageHardLimitBytes());
}
