import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { CalendarToolbar } from "@/components/calendar/calendar-toolbar";
import { MonthView } from "@/components/calendar/month-view";
import { WeekView } from "@/components/calendar/week-view";
import { PlatformIcon } from "@/components/platform-icon";
import { StatusBadge, StatusLegend } from "@/components/status-badge";
import { ButtonLink } from "@/components/ui/button";
import { getAccount } from "@/features/accounts/queries";
import { listScheduledVideos, listUnscheduledVideos, type CalendarVideo } from "@/features/videos/queries";
import { PLATFORM_LABEL } from "@/lib/constants";
import { calendarRange, dayKey, nowInTz, parseDayKey, toUtcISO, type CalendarView } from "@/lib/dates";

export async function generateMetadata({ params }: PageProps<"/contas/[id]">): Promise<Metadata> {
  const { id } = await params;
  const account = await getAccount(id);
  return { title: account?.display_name ?? "Conta" };
}

export default async function AccountPage({ params, searchParams }: PageProps<"/contas/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const view: CalendarView = sp.visao === "mes" ? "mes" : "semana";
  const anchor = parseDayKey(typeof sp.data === "string" ? sp.data : undefined);
  const today = nowInTz();
  const { days, start, endExclusive } = calendarRange(anchor, view);

  const account = await getAccount(id);
  if (!account) notFound();

  const [scheduled, unscheduled] = await Promise.all([
    listScheduledVideos(id, toUtcISO(start), toUtcISO(endExclusive)),
    listUnscheduledVideos(id),
  ]);

  const byDay = new Map<string, CalendarVideo[]>();
  for (const v of scheduled) {
    const key = dayKey(v.scheduled_at!);
    byDay.set(key, [...(byDay.get(key) ?? []), v]);
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-center gap-4">
        <span className="grid size-16 shrink-0 place-items-center rounded-[var(--radius-card)] bg-surface-2">
          <PlatformIcon platform={account.platform} className="size-7" />
        </span>
        <div className="min-w-0 flex-1">
          <Link href="/" className="text-meta text-muted hover:text-text">Contas</Link>
          <h1 className="font-display text-page font-bold">{account.display_name}</h1>
          <p className="mt-1 text-muted">
            @{account.username} no {PLATFORM_LABEL[account.platform]}
            {account.niche ? `, ${account.niche}` : ""}
          </p>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <ButtonLink href={`/contas/${account.id}/editar`} variant="secondary">Editar conta</ButtonLink>
          <ButtonLink href={`/videos/novo?conta=${account.id}`} variant="primary">
            <Plus /> Enviar vídeo
          </ButtonLink>
        </div>
      </header>

      <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_17rem]">
        <section aria-label="Calendário" className="flex min-w-0 flex-col gap-4">
          <CalendarToolbar base={`/contas/${account.id}`} view={view} anchor={anchor} today={today} />
          {view === "mes" ? (
            <MonthView base={`/contas/${account.id}`} days={days} anchor={anchor} todayKey={dayKey(today)} byDay={byDay} />
          ) : (
            <WeekView days={days} todayKey={dayKey(today)} byDay={byDay} />
          )}
          <StatusLegend />
        </section>

        <aside aria-labelledby="sem-data" className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <h2 id="sem-data" className="font-display text-card font-bold">Sem data</h2>
            <span className="grid h-6 min-w-6 place-items-center rounded-full bg-surface-2 px-2 text-meta font-semibold tabular-nums">{unscheduled.length}</span>
          </div>
          {unscheduled.length === 0 ? (
            <p className="rounded-[var(--radius-card)] border border-dashed border-border px-4 py-6 text-meta text-muted">
              Todo vídeo pendente já tem data.{" "}
              <Link href={`/videos/novo?conta=${account.id}`} className="font-semibold text-link underline-offset-4 hover:underline">
                Enviar outro vídeo
              </Link>
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {unscheduled.map((v) => (
                <li key={v.id}>
                  <Link
                    href={`/videos/${v.id}`}
                    className="flex flex-col gap-2.5 rounded-[var(--radius-card)] border border-border bg-surface p-3.5 transition-colors hover:border-muted/50"
                  >
                    <span className="line-clamp-2 font-semibold leading-snug">{v.title}</span>
                    <span className="flex items-center justify-between gap-2">
                      <StatusBadge status={v.status} />
                      {v.file_deleted_at && <span className="text-meta text-muted">sem arquivo</span>}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
