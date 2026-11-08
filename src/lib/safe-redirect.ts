/**
 * Garante que um destino de redirecionamento (ex.: ?next=) seja um caminho
 * interno do app. Resolve como o navegador faz (WHATWG URL), o que cobre
 * truques como "/\evil.com" e "//evil.com", que viram outro domínio.
 */
const INTERNAL_ORIGIN = "http://app.internal";

export function safeNextPath(next: unknown, fallback = "/"): string {
  if (typeof next !== "string" || !next.startsWith("/")) return fallback;
  try {
    const url = new URL(next, INTERNAL_ORIGIN);
    if (url.origin !== INTERNAL_ORIGIN) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
