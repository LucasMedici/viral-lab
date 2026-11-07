import Link from "next/link";
import { PlatformIcon } from "@/components/platform-icon";
import { STATUS_DOT } from "@/components/status-badge";
import type { Platform, VideoStatus } from "@/lib/constants";
import { formatTz, dayKey, nowInTz } from "@/lib/dates";
import { cn } from "@/lib/utils";

type Item = {
  id: string;
  title: string;
  status: VideoStatus;
  scheduled_at: string | null;
  account: { id: string; platform: Platform; username: string; display_name: string } | null;
};

function whenLabel(iso: string): string {
  const today = dayKey(nowInTz());
  const tomorrow = dayKey(new Date(Date.now() + 86_400_000));
  const key = dayKey(iso);
  const time = formatTz(iso, "HH:mm");
  if (key === today) return `Hoje, ${time}`;
  if (key === tomorrow) return `Amanhã, ${time}`;
  return formatTz(iso, "EEE, d 'de' MMM, HH:mm");
}

export function UpcomingList({ overdue, upcoming }: { overdue: Item[]; upcoming: Item[] }) {
  if (!overdue.length && !upcoming.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhuma publicação agendada. Defina data e hora nos vídeos para vê-los aqui.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-5">
      {overdue.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-danger">
            {overdue.length === 1 ? "1 vídeo passou da hora" : `${overdue.length} vídeos passaram da hora`}
          </h3>
          <Rows items={overdue} overdue />
        </div>
      )}
      {upcoming.length > 0 && <Rows items={upcoming} />}
    </div>
  );
}

function Rows({ items, overdue = false }: { items: Item[]; overdue?: boolean }) {
  return (
    <ol className="flex flex-col divide-y divide-border overflow-hidden rounded-[var(--radius-md)] border border-border bg-surface">
      {items.map((v) => (
        <li key={v.id}>
          <Link href={`/videos/${v.id}`} className="flex items-start gap-3 px-3 py-2.5 hover:bg-surface-muted">
            <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", STATUS_DOT[v.status])} aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className={cn("block text-xs tabular-nums", overdue ? "text-danger" : "text-muted-foreground")}>
                {v.scheduled_at ? whenLabel(v.scheduled_at) : ""}
              </span>
              <span className="block truncate text-sm font-medium">{v.title}</span>
              {v.account && (
                <span className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <PlatformIcon platform={v.account.platform} className="size-3" />
                  <span className="truncate">@{v.account.username}</span>
                </span>
              )}
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
