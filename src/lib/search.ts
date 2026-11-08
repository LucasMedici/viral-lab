/** Normaliza para busca: minúsculas, sem acentos e espaços extras. */
export function normalize(text: string): string {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Pontua o quanto um item combina com a busca (0 = não combina).
 * Todas as palavras digitadas precisam aparecer no rótulo ou nas palavras-chave.
 * Rótulo começando com a busca > alguma palavra começando com ela > contém.
 */
export function matchScore(query: string, label: string, keywords: string[] = []): number {
  const q = normalize(query);
  if (!q) return 1;
  const l = normalize(label);
  const haystack = normalize([label, ...keywords].join(" "));
  if (!q.split(" ").every((token) => haystack.includes(token))) return 0;
  if (l.startsWith(q)) return 4;
  if (l.split(" ").some((word) => word.startsWith(q))) return 3;
  if (l.includes(q)) return 2;
  return 1;
}

/** Filtra e ordena itens pela busca, preservando a ordem original em empates. */
export function rankByQuery<T>(items: T[], query: string, get: (item: T) => { label: string; keywords?: string[] }): T[] {
  return items
    .map((item, index) => ({ item, index, score: matchScore(query, get(item).label, get(item).keywords) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((x) => x.item);
}
