import { STATUS_LABEL, type VideoStatus } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const STATUS_DOT: Record<VideoStatus, string> = {
  gerado: "bg-status-gerado",
  aprovado: "bg-status-aprovado",
  agendado: "bg-status-agendado",
  publicado: "bg-status-publicado",
};

export const STATUS_TINT: Record<VideoStatus, string> = {
  gerado: "border-l-status-gerado bg-status-gerado/10 hover:bg-status-gerado/18",
  aprovado: "border-l-status-aprovado bg-status-aprovado/12 hover:bg-status-aprovado/20",
  agendado: "border-l-status-agendado bg-status-agendado/12 hover:bg-status-agendado/20",
  publicado: "border-l-status-publicado bg-status-publicado/12 hover:bg-status-publicado/20",
};

export function StatusBadge({ status, className }: { status: VideoStatus; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium text-foreground", className)}>
      <span className={cn("size-2 rounded-full", STATUS_DOT[status])} aria-hidden="true" />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function StatusLegend({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-4 gap-y-1", className)}>
      {(Object.keys(STATUS_LABEL) as VideoStatus[]).map((s) => (
        <StatusBadge key={s} status={s} className="text-muted-foreground" />
      ))}
    </div>
  );
}
