import Link from "next/link";
import { STATUS_TINT } from "@/components/status-badge";
import { STATUS_LABEL } from "@/lib/constants";
import { formatTz } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { CalendarVideo } from "@/features/videos/queries";

export function VideoChip({ video, showTime = true, className }: { video: CalendarVideo; showTime?: boolean; className?: string }) {
  return (
    <Link
      href={`/videos/${video.id}`}
      title={`${video.title} (${STATUS_LABEL[video.status]})`}
      className={cn(
        "block rounded-[var(--radius-sm)] border-l-[3px] px-1.5 py-1 text-xs leading-tight text-foreground transition-colors",
        STATUS_TINT[video.status],
        className,
      )}
    >
      {showTime && video.scheduled_at && (
        <span className="mr-1 font-medium tabular-nums text-muted-foreground">{formatTz(video.scheduled_at, "HH:mm")}</span>
      )}
      <span className={cn(video.status === "publicado" && "text-muted-foreground")}>{video.title}</span>
      <span className="sr-only">, {STATUS_LABEL[video.status]}</span>
    </Link>
  );
}
