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
      <header className="flex flex-wrap items-start gap-4">
        <span className="grid size-14 shrink-0 place-items-center rounded-[var(--radius-lg)] border border-border bg-surface">
          <PlatformIcon platform={account.platform} className="size-7" />
        </span>
        <div className="min-w-0 flex-1">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">Contas</Link>
          <h1 className="font-display text-3xl font-bold leading-tight tracking-tight">{account.display_name}</h1>
          <p className="text-sm text-muted-foreground">
            @{account.username} no {PLATFORM_LABEL[account.platform]}
            {account.niche ? `, ${account.niche}` : ""}
          </p>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <ButtonLink href={`/contas/${account.id}/editar`} variant="ghost" size="sm">Editar conta</ButtonLink>
          <ButtonLink href={`/videos/novo?conta=${account.id}`} size="sm">
            <Plus /> Enviar vídeo
          </ButtonLink>
        </div>
      </header>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_17rem]">
        <section aria-label="Calendário" className="flex min-w-0 flex-col gap-4">
          <CalendarToolbar base={`/contas/${account.id}`} view={view} anchor={anchor} today={today} />
          {view === "mes" ? (
            <MonthView base={`/contas/${account.id}`} days={days} anchor={anchor} todayKey={dayKey(today)} byDay={byDay} />
          ) : (
            <WeekView days={days} todayKey={dayKey(today)} byDay={byDay} />
          )}
          <StatusLegend className="text-xs" />
        </section>

        <aside aria-labelledby="sem-data" className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <h2 id="sem-data" className="font-display text-lg font-semibold tracking-tight">Sem data</h2>
            <span className="text-sm tabular-nums text-muted-foreground">{unscheduled.length}</span>
          </div>
          {unscheduled.length === 0 ? (
            <p className="rounded-[var(--radius-md)] border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
              Todo vídeo pendente já tem data.{" "}
              <Link href={`/videos/novo?conta=${account.id}`} className="font-medium text-primary underline-offset-4 hover:underline">
                Enviar outro vídeo
              </Link>
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {unscheduled.map((v) => (
                <li key={v.id}>
                  <Link
                    href={`/videos/${v.id}`}
                    className="flex flex-col gap-1 rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2.5 transition-colors hover:border-primary/50"
                  >
                    <span className="line-clamp-2 text-sm font-medium">{v.title}</span>
                    <span className="flex items-center justify-between gap-2">
                      <StatusBadge status={v.status} className="text-muted-foreground" />
                      {v.file_deleted_at && <span className="text-xs text-muted-foreground">sem arquivo</span>}
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
