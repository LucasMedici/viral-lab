import Link from "next/link";
import { format, isSameMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { TZDate } from "@date-fns/tz";
import type { CalendarVideo } from "@/features/videos/queries";
import { dayKey } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { VideoChip } from "./video-chip";

const WEEKDAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const MAX_CHIPS = 3;

export function MonthView({
  base,
  days,
  anchor,
  todayKey,
  byDay,
}: {
  base: string;
  days: TZDate[];
  anchor: TZDate;
  todayKey: string;
  byDay: Map<string, CalendarVideo[]>;
}) {
  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface">
      <div className="grid grid-cols-7 border-b border-border">
        {WEEKDAYS.map((d) => (
          <div key={d} className="px-2.5 py-2.5 text-meta text-muted">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const key = dayKey(day);
          const items = byDay.get(key) ?? [];
          const outside = !isSameMonth(day, anchor);
          const isToday = key === todayKey;
          const weekHref = `${base}?visao=semana&data=${key}`;
          return (
            <div
              key={key}
              className={cn(
                "relative flex min-h-20 flex-col gap-1.5 border-border p-1.5 sm:min-h-32 sm:p-2",
                i % 7 !== 6 && "border-r",
                i < days.length - 7 && "border-b",
                outside && "bg-background/60",
              )}
            >
              <span
                className={cn(
                  "grid size-7 place-items-center rounded-full text-meta tabular-nums",
                  outside ? "text-muted/50" : "text-text",
                  isToday && "bg-accent font-semibold text-accent-foreground",
                )}
                aria-label={format(day, "d 'de' MMMM", { locale: ptBR })}
              >
                {format(day, "d")}
              </span>

              {/* Celular: a célula inteira abre a semana (onde os vídeos aparecem com status) */}
              {items.length > 0 && (
                <>
                  <Link
                    href={weekHref}
                    aria-label={`${format(day, "d 'de' MMMM", { locale: ptBR })}: ${items.length} ${items.length === 1 ? "vídeo" : "vídeos"}, ver a semana`}
                    className="absolute inset-0 transition-colors active:bg-surface-2 sm:hidden"
                  />
                  <span
                    aria-hidden="true"
                    className="pointer-events-none relative inline-flex h-5 w-fit items-center rounded-full bg-surface-2 px-1.5 text-[0.6875rem] font-semibold tabular-nums sm:hidden"
                  >
                    {items.length}
                  </span>
                </>
              )}

              <div className="hidden flex-col gap-1 sm:flex">
                {items.slice(0, MAX_CHIPS).map((v) => (
                  <VideoChip key={v.id} video={v} compact />
                ))}
                {items.length > MAX_CHIPS && (
                  <Link href={weekHref} className="px-1 text-meta text-muted hover:text-text">
                    +{items.length - MAX_CHIPS} mais
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
