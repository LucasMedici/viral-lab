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
    "grid size-9 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-text";

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
      <h2 className="font-display text-section font-bold" aria-live="polite">
        {rangeLabel(anchor, view)}
      </h2>
      <Link
        href={href(base, view, today)}
        className="inline-flex h-8 items-center rounded-full bg-surface-2 px-3 text-meta font-semibold text-muted transition-colors hover:text-text"
      >
        Hoje
      </Link>
      <div role="tablist" aria-label="Visão do calendário" className="ml-auto flex rounded-full bg-surface-2 p-1">
        {(["semana", "mes"] as const).map((v) => (
          <Link
            key={v}
            role="tab"
            aria-selected={view === v}
            href={href(base, v, anchor)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-meta font-semibold text-muted transition-colors hover:text-text",
              view === v && "bg-surface text-text",
            )}
          >
            {v === "mes" ? "Mês" : "Semana"}
          </Link>
        ))}
      </div>
    </div>
  );
}
