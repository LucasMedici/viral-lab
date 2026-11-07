export const PLATFORMS = ["tiktok", "youtube", "instagram"] as const;
export type Platform = (typeof PLATFORMS)[number];

export const PLATFORM_LABEL: Record<Platform, string> = {
  tiktok: "TikTok",
  youtube: "YouTube",
  instagram: "Instagram",
};

/** Nome do formato curto em cada plataforma. */
export const PLATFORM_FORMAT: Record<Platform, string> = {
  tiktok: "TikTok",
  youtube: "Short",
  instagram: "Reel",
};

export const VIDEO_STATUSES = ["gerado", "aprovado", "agendado", "publicado"] as const;
export type VideoStatus = (typeof VIDEO_STATUSES)[number];

export const STATUS_LABEL: Record<VideoStatus, string> = {
  gerado: "Gerado",
  aprovado: "Aprovado",
  agendado: "Agendado",
  publicado: "Publicado",
};

/** Tamanho máximo aceito por upload (R2 aceita até 5 GB num PUT único). */
export const MAX_UPLOAD_BYTES = 2 * 1024 ** 3;

/** A partir deste percentual do plano gratuito o indicador de uso fica em alerta. */
export const STORAGE_WARN_RATIO = 0.8;
