import path from "node:path";

/** Extensões de vídeo aceitas pelo MCP e o tipo MIME enviado ao storage. */
export const VIDEO_TYPES: Record<string, string> = {
  ".mp4": "video/mp4",
  ".m4v": "video/x-m4v",
  ".mov": "video/quicktime",
  ".webm": "video/webm",
};

/**
 * Converte o caminho que o Claude Desktop (Windows) informa para o caminho no WSL,
 * onde o MCP roda:
 * - `C:\Users\eu\Videos\a.mp4`             → `/mnt/c/Users/eu/Videos/a.mp4`
 * - `\\wsl.localhost\Ubuntu\home\eu\a.mp4` → `/home/eu/a.mp4`
 * - caminhos POSIX absolutos ficam como estão.
 * Lança erro para caminhos relativos (não dá para saber a pasta de origem).
 */
export function toLocalPath(input: string): string {
  const raw = input.trim().replace(/^["']|["']$/g, "");
  if (!raw) throw new Error("Informe o caminho");

  const drive = /^([a-zA-Z]):[\\/](.*)$/.exec(raw);
  if (drive) {
    const rest = drive[2].replace(/\\/g, "/");
    return path.posix.normalize(`/mnt/${drive[1].toLowerCase()}/${rest}`);
  }

  const wslShare = /^\\\\wsl(?:\.localhost|\$)\\[^\\]+\\(.*)$/i.exec(raw);
  if (wslShare) return path.posix.normalize(`/${wslShare[1].replace(/\\/g, "/")}`);

  const posix = raw.replace(/\\/g, "/");
  if (!posix.startsWith("/")) {
    throw new Error(`Use o caminho completo (ex.: C:\\Users\\voce\\Videos\\video.mp4), não "${input}"`);
  }
  return path.posix.normalize(posix);
}

/** Caminho para exibir ao usuário no formato do Windows quando estiver num disco montado (/mnt/c/…). */
export function toDisplayPath(localPath: string): string {
  const m = /^\/mnt\/([a-z])(\/.*)?$/.exec(localPath);
  if (!m) return localPath;
  return `${m[1].toUpperCase()}:${(m[2] ?? "/").replace(/\//g, "\\")}`;
}

/** Tipo MIME de vídeo pela extensão, ou `null` se não for um vídeo aceito. */
export function videoMimeFor(filePath: string): string | null {
  return VIDEO_TYPES[path.posix.extname(filePath).toLowerCase()] ?? null;
}
