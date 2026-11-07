import Link from "next/link";
import { PlatformIcon } from "@/components/platform-icon";
import { StatusDot } from "@/components/status-badge";
import { STATUS_LABEL, type Platform, type VideoStatus } from "@/lib/constants";
import { dayKey, formatTz, nowInTz } from "@/lib/dates";
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
      <p className="rounded-[var(--radius-card)] border border-dashed border-border px-4 py-6 text-meta text-muted">
        Nenhuma publicação agendada. Defina data e hora nos vídeos para vê-los aqui.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-6">
      {overdue.length > 0 && (
        <div>
          <h3 className="mb-2 text-meta font-semibold text-danger">
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
    <ol className="flex flex-col divide-y divide-border overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface">
      {items.map((v) => (
        <li key={v.id}>
          <Link href={`/videos/${v.id}`} className="flex flex-col gap-1 px-4 py-3 transition-colors hover:bg-surface-2">
            <span className={cn("text-meta tabular-nums", overdue ? "font-semibold text-danger" : "text-muted")}>
              {v.scheduled_at ? whenLabel(v.scheduled_at) : ""}
            </span>
            <span className="truncate font-semibold">{v.title}</span>
            <span className="flex items-center justify-between gap-2 text-meta text-muted">
              {v.account && (
                <span className="flex min-w-0 items-center gap-1.5">
                  <PlatformIcon platform={v.account.platform} className="size-3.5" />
                  <span className="truncate">@{v.account.username}</span>
                </span>
              )}
              <span className="inline-flex shrink-0 items-center gap-1.5">
                <StatusDot status={v.status} />
                {STATUS_LABEL[v.status]}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
