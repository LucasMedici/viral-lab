import { formatBytes } from "@/lib/utils";

/**
 * Regra pura do teto de armazenamento (sem I/O, testável).
 * Devolve a mensagem de erro se `used + newBytes` passar de `hardLimit`, ou `null` se couber.
 */
export function storageLimitError(used: number, newBytes: number, hardLimit: number): string | null {
  if (used + newBytes <= hardLimit) return null;
  const free = Math.max(hardLimit - used, 0);
  return `Limite de armazenamento do app atingido: ${formatBytes(used)} de ${formatBytes(hardLimit)} em uso e o envio tem ${formatBytes(newBytes)} (cabem ${formatBytes(free)}). Apague os arquivos de vídeos já publicados para liberar espaço`;
}
