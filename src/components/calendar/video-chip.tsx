import Link from "next/link";
import { STATUS_BLOCK } from "@/components/status-badge";
import type { CalendarVideo } from "@/features/videos/queries";
import { STATUS_LABEL } from "@/lib/constants";
import { formatTz } from "@/lib/dates";
import { cn } from "@/lib/utils";

/** Bloco de vídeo no calendário: faixa na cor do status + nome do status por extenso. */
export function VideoChip({ video, compact = false, className }: { video: CalendarVideo; compact?: boolean; className?: string }) {
  return (
    <Link
      href={`/videos/${video.id}`}
      title={`${video.title} (${STATUS_LABEL[video.status]})`}
      className={cn(
        "flex flex-col gap-0.5 rounded-[6px] border-l-[3px] px-2 py-1.5 text-text transition-colors",
        STATUS_BLOCK[video.status],
        className,
      )}
    >
      <span className={cn("text-meta font-semibold leading-snug", compact ? "line-clamp-2" : "line-clamp-3")}>
        {video.scheduled_at && <span className="mr-1 tabular-nums">{formatTz(video.scheduled_at, "HH:mm")}</span>}
        <span className="font-normal">{video.title}</span>
      </span>
      <span className="text-[0.6875rem] leading-tight text-muted">{STATUS_LABEL[video.status]}</span>
    </Link>
  );
}
