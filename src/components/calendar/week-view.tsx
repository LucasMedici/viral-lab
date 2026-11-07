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
    <div className="grid overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface md:grid-cols-7">
      {days.map((day, i) => {
        const key = dayKey(day);
        const items = byDay.get(key) ?? [];
        const isToday = key === todayKey;
        return (
          <section
            key={key}
            aria-label={format(day, "EEEE, d 'de' MMMM", { locale: ptBR })}
            className={cn(
              "flex flex-col border-border md:min-h-80",
              i < 6 && "border-b md:border-b-0 md:border-r",
            )}
          >
            <header className={cn("flex items-baseline gap-2 px-3 py-2 md:flex-col md:gap-0", isToday && "bg-primary/8")}>
              <span className="text-xs text-muted-foreground">{format(day, "EEE", { locale: ptBR })}</span>
              <span className={cn("font-display text-2xl font-semibold tabular-nums leading-none tracking-tight", isToday && "text-primary")}>
                {format(day, "d")}
              </span>
            </header>
            <div className="flex flex-col gap-1.5 px-2 pb-3 pt-1">
              {items.length === 0 ? (
                <span className="px-1 text-xs text-muted-foreground/60 md:hidden">Livre</span>
              ) : (
                items.map((v) => <VideoChip key={v.id} video={v} className="py-1.5" />)
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
