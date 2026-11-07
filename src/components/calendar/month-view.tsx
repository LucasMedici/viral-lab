import Link from "next/link";
import { format, isSameMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { TZDate } from "@date-fns/tz";
import { STATUS_DOT } from "@/components/status-badge";
import type { CalendarVideo } from "@/features/videos/queries";
import { dayKey } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { VideoChip } from "./video-chip";

const WEEKDAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const MAX_CHIPS = 3;

export function MonthView({
  days,
  anchor,
  todayKey,
  byDay,
  base,
}: {
  base: string;
  days: TZDate[];
  anchor: TZDate;
  todayKey: string;
  byDay: Map<string, CalendarVideo[]>;
}) {
  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface">
      <div className="grid grid-cols-7 border-b border-border">
        {WEEKDAYS.map((d) => (
          <div key={d} className="px-2 py-2 text-xs font-medium text-muted-foreground">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const key = dayKey(day);
          const items = byDay.get(key) ?? [];
          const outside = !isSameMonth(day, anchor);
          const isToday = key === todayKey;
          return (
            <div
              key={key}
              className={cn(
                "min-h-20 border-border p-1 sm:min-h-28 sm:p-1.5",
                i % 7 !== 6 && "border-r",
                i < days.length - 7 && "border-b",
                outside && "bg-surface-muted/50",
              )}
            >
              <div className="mb-1 flex items-center justify-between">
                <span
                  className={cn(
                    "grid size-6 place-items-center rounded-full text-xs tabular-nums",
                    outside ? "text-muted-foreground/60" : "text-foreground",
                    isToday && "bg-primary font-semibold text-primary-foreground",
                  )}
                  aria-label={format(day, "d 'de' MMMM", { locale: ptBR })}
                >
                  {format(day, "d")}
                </span>
              </div>
              {/* Mobile: pontos coloridos (toque abre a semana); telas maiores: chips com título */}
              {items.length > 0 && (
                <Link
                  href={`${base}?visao=semana&data=${key}`}
                  aria-label={`${items.length} ${items.length === 1 ? "vídeo" : "vídeos"}, ver semana`}
                  className="flex min-h-6 flex-wrap content-start gap-1 rounded-[var(--radius-sm)] sm:hidden"
                >
                  {items.map((v) => (
                    <span key={v.id} className={cn("size-2 rounded-full", STATUS_DOT[v.status])} />
                  ))}
                </Link>
              )}
              <div className="hidden flex-col gap-1 sm:flex">
                {items.slice(0, MAX_CHIPS).map((v) => (
                  <VideoChip key={v.id} video={v} className="line-clamp-2 break-words" />
                ))}
                {items.length > MAX_CHIPS && (
                  <span className="px-1.5 text-xs text-muted-foreground">+{items.length - MAX_CHIPS} mais</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
