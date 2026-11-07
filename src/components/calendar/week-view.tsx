import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { TZDate } from "@date-fns/tz";
import type { CalendarVideo } from "@/features/videos/queries";
import { dayKey } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { VideoChip } from "./video-chip";

export function WeekView({
  days,
  todayKey,
  byDay,
}: {
  days: TZDate[];
  todayKey: string;
  byDay: Map<string, CalendarVideo[]>;
}) {
  return (
    <div className="grid overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface md:grid-cols-7">
      {days.map((day, i) => {
        const key = dayKey(day);
        const items = byDay.get(key) ?? [];
        const isToday = key === todayKey;
        return (
          <section
            key={key}
            aria-label={format(day, "EEEE, d 'de' MMMM", { locale: ptBR })}
            className={cn("flex flex-col border-border md:min-h-96", i < 6 && "border-b md:border-b-0 md:border-r")}
          >
            <header className="flex items-center gap-2 px-3 pb-2 pt-3 md:flex-col md:items-start md:gap-1.5">
              <span className="text-meta text-muted">{format(day, "EEE", { locale: ptBR })}</span>
              <span
                className={cn(
                  "-ml-1.5 grid size-9 place-items-center rounded-full font-display text-section font-bold tabular-nums leading-none tracking-[-0.02em]",
                  isToday && "bg-accent text-accent-foreground",
                )}
              >
                {format(day, "d")}
              </span>
            </header>
            <div className="flex flex-col gap-1.5 px-2 pb-3">
              {items.length === 0 ? (
                <span className="px-1 text-meta text-muted/60 md:hidden">Livre</span>
              ) : (
                items.map((v) => <VideoChip key={v.id} video={v} />)
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
