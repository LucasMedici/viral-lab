import { STATUS_LABEL, VIDEO_STATUSES, type VideoStatus } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** Cor do ponto de cada status (docs/BRAND.md). */
export const STATUS_DOT: Record<VideoStatus, string> = {
  gerado: "bg-status-gerado",
  aprovado: "bg-status-aprovado",
  agendado: "bg-status-agendado",
  publicado: "bg-status-publicado",
};

/** Bloco do calendário: faixa na cor do status + preenchimento suave; texto sempre na cor do texto. */
export const STATUS_BLOCK: Record<VideoStatus, string> = {
  gerado: "border-l-status-gerado bg-status-gerado/12 hover:bg-status-gerado/20",
  aprovado: "border-l-status-aprovado bg-status-aprovado/12 hover:bg-status-aprovado/20",
  agendado: "border-l-status-agendado bg-status-agendado/14 hover:bg-status-agendado/22",
  publicado: "border-l-status-publicado bg-status-publicado/18 hover:bg-status-publicado/28",
};

export function StatusDot({ status, className }: { status: VideoStatus; className?: string }) {
  return <span aria-hidden="true" className={cn("size-2 shrink-0 rounded-full", STATUS_DOT[status], className)} />;
}

/**
 * Chip de status: ponto colorido + nome (nunca só a cor).
 * No tema claro, "Publicado" usa chip Tinta para o ponto Ácido ter contraste.
 */
export function StatusBadge({ status, className }: { status: VideoStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 w-fit shrink-0 items-center gap-1.5 rounded-full px-2.5 text-meta font-semibold",
        status === "publicado"
          ? "bg-text text-background dark:bg-status-publicado/14 dark:text-text"
          : "bg-surface-2 text-text",
        className,
      )}
    >
      <StatusDot status={status} />
      {STATUS_LABEL[status]}
    </span>
  );
}

/** Legenda simples (ponto + nome) para o calendário. */
export function StatusLegend({ className }: { className?: string }) {
  return (
    <ul className={cn("flex flex-wrap items-center gap-x-4 gap-y-1 text-meta text-muted", className)} aria-label="Legenda de status">
      {VIDEO_STATUSES.map((s) => (
        <li key={s} className="inline-flex items-center gap-1.5">
          <StatusDot status={s} className={s === "publicado" ? "ring-1 ring-text/40 dark:ring-0" : undefined} />
          {STATUS_LABEL[s]}
        </li>
      ))}
    </ul>
  );
}
