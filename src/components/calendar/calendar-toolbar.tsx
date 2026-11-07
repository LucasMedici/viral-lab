import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addDays, addMonths, endOfWeek, format, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { TZDate } from "@date-fns/tz";
import type { CalendarView } from "@/lib/dates";
import { cn } from "@/lib/utils";

function href(base: string, view: CalendarView, date: Date) {
  return `${base}?visao=${view}&data=${format(date, "yyyy-MM-dd")}`;
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function rangeLabel(anchor: TZDate, view: CalendarView) {
  if (view === "mes") return capitalize(format(anchor, "MMMM 'de' yyyy", { locale: ptBR }));
  const s = startOfWeek(anchor, { weekStartsOn: 0 });
  const e = endOfWeek(anchor, { weekStartsOn: 0 });
  const sameMonth = s.getMonth() === e.getMonth();
  return sameMonth
    ? `${format(s, "d")} a ${format(e, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}`
    : `${format(s, "d 'de' MMM", { locale: ptBR })} a ${format(e, "d 'de' MMM 'de' yyyy", { locale: ptBR })}`;
}

export function CalendarToolbar({ base, view, anchor, today }: { base: string; view: CalendarView; anchor: TZDate; today: TZDate }) {
  const prev = view === "mes" ? addMonths(anchor, -1) : addDays(anchor, -7);
  const next = view === "mes" ? addMonths(anchor, 1) : addDays(anchor, 7);
  const navBtn =
    "grid size-8 place-items-center rounded-[var(--radius-md)] text-muted-foreground hover:bg-surface-muted hover:text-foreground";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1">
        <Link href={href(base, view, prev)} className={navBtn} aria-label={view === "mes" ? "Mês anterior" : "Semana anterior"}>
          <ChevronLeft className="size-4" />
        </Link>
        <Link href={href(base, view, next)} className={navBtn} aria-label={view === "mes" ? "Próximo mês" : "Próxima semana"}>
          <ChevronRight className="size-4" />
        </Link>
      </div>
      <h2 className="font-display text-xl font-semibold tracking-tight" aria-live="polite">
        {rangeLabel(anchor, view)}
      </h2>
      <Link
        href={href(base, view, today)}
        className="rounded-[var(--radius-md)] border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-surface-muted hover:text-foreground"
      >
        Hoje
      </Link>
      <div role="tablist" aria-label="Visão do calendário" className="ml-auto flex rounded-[var(--radius-md)] border border-border bg-surface p-0.5">
        {(["semana", "mes"] as const).map((v) => (
          <Link
            key={v}
            role="tab"
            aria-selected={view === v}
            href={href(base, v, anchor)}
            className={cn(
              "rounded-[calc(var(--radius-md)-2px)] px-3 py-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
              view === v && "bg-surface-muted text-foreground",
            )}
          >
            {v === "mes" ? "Mês" : "Semana"}
          </Link>
        ))}
      </div>
    </div>
  );
}
