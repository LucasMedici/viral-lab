/** Junta classes condicionalmente (sem dependências). */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/** Formata bytes em pt-BR (ex.: 1,2 GB). */
export function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null) return "—";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  const digits = i === 0 || value >= 100 ? 0 : 1;
  return `${value.toLocaleString("pt-BR", { maximumFractionDigits: digits, minimumFractionDigits: 0 })} ${units[i]}`;
}

/** Normaliza hashtags a partir de texto livre ("#a #b, c") → ["a", "b", "c"]. */
export function parseHashtags(input: string | string[] | null | undefined): string[] {
  const raw = Array.isArray(input) ? input.join(" ") : (input ?? "");
  const tags = raw
    .split(/[\s,;]+/)
    .map((t) => t.replace(/^#+/, "").trim())
    .filter(Boolean);
  return Array.from(new Set(tags));
}

export function formatHashtags(tags: string[]): string {
  return tags.map((t) => `#${t}`).join(" ");
}
