import { TZDate } from "@date-fns/tz";
import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";

export const APP_TZ = process.env.NEXT_PUBLIC_APP_TIMEZONE || "America/Sao_Paulo";

/** "Agora" no fuso do app. */
export function nowInTz(): TZDate {
  return TZDate.tz(APP_TZ);
}

/** Converte um ISO/Date para uma data no fuso do app. */
export function inTz(value: string | Date): TZDate {
  return new TZDate(new Date(value).getTime(), APP_TZ);
}

export function formatTz(value: string | Date, pattern: string): string {
  return format(inTz(value), pattern, { locale: ptBR });
}

/** Chave de dia (yyyy-MM-dd) no fuso do app, usada para agrupar no calendário. */
export function dayKey(value: string | Date): string {
  return format(inTz(value), "yyyy-MM-dd");
}

/** Valor para <input type="datetime-local"> a partir de um ISO, no fuso do app. */
export function toDateTimeLocal(value: string | null | undefined): string {
  if (!value) return "";
  return format(inTz(value), "yyyy-MM-dd'T'HH:mm");
}

/** Interpreta o valor de um <input type="datetime-local"> como horário do fuso do app. */
export function fromDateTimeLocal(value: string | null | undefined): string | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  if (!m) return null;
  const [, y, mo, d, h, mi] = m.map(Number);
  return toUtcISO(new TZDate(y, mo - 1, d, h, mi, APP_TZ));
}

/** ISO em UTC ("…Z"). TZDate.toISOString() devolve com offset (-03:00). */
export function toUtcISO(date: Date): string {
  return new Date(date.getTime()).toISOString();
}

/** Converte "yyyy-MM-dd" em uma data (meia-noite) no fuso do app. */
export function parseDayKey(key: string | undefined): TZDate {
  const m = key ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(key) : null;
  if (!m) {
    const now = nowInTz();
    return new TZDate(now.getFullYear(), now.getMonth(), now.getDate(), APP_TZ);
  }
  return new TZDate(Number(m[1]), Number(m[2]) - 1, Number(m[3]), APP_TZ);
}

export type CalendarView = "mes" | "semana";

/** Intervalo de dias exibido no calendário (semana começa no domingo). */
export function calendarRange(anchor: TZDate, view: CalendarView) {
  const opts = { weekStartsOn: 0 as const };
  const start: TZDate =
    view === "mes" ? startOfWeek(startOfMonth(anchor), opts) : startOfWeek(anchor, opts);
  const end: TZDate = view === "mes" ? endOfWeek(endOfMonth(anchor), opts) : endOfWeek(anchor, opts);
  const days: TZDate[] = [];
  for (let d: TZDate = start; d <= end; d = addDays(d, 1)) days.push(d);
  // Meia-noite do dia seguinte ao último dia exibido (limite exclusivo da consulta).
  const endExclusive = new TZDate(end.getFullYear(), end.getMonth(), end.getDate() + 1, APP_TZ);
  return { start, endExclusive, days };
}
