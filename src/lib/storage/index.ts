import "server-only";
import { r2Storage } from "./r2";
import type { StorageProvider } from "./types";

/** Provedor de storage ativo. Troque aqui para mudar de provedor. */
export const storage: StorageProvider = r2Storage;

export type { StorageProvider };

/** Gera a chave do objeto de um vídeo: videos/{accountId}/{uuid}.{ext} */
export function videoObjectKey(accountId: string, fileName: string): string {
  const ext = /\.([a-z0-9]{1,8})$/i.exec(fileName)?.[1]?.toLowerCase() ?? "mp4";
  return `videos/${accountId}/${crypto.randomUUID()}.${ext}`;
}
