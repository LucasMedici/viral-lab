import Link from "next/link";
import { Plus, Upload } from "lucide-react";
import { LogoHero } from "@/components/logo";
import { PlatformIcon } from "@/components/platform-icon";
import { UpcomingList } from "@/components/upcoming-list";
import { ButtonLink } from "@/components/ui/button";
import { AccountCard } from "@/features/accounts/account-card";
import { listAccounts } from "@/features/accounts/queries";
import { listUpcoming } from "@/features/videos/queries";
import { PLATFORM_LABEL, PLATFORMS, type Platform } from "@/lib/constants";
import { cn } from "@/lib/utils";

export default async function AccountsPage({ searchParams }: PageProps<"/">) {
  const { plataforma } = await searchParams;
  const filter = PLATFORMS.includes(plataforma as Platform) ? (plataforma as Platform) : undefined;

  const [accounts, allAccounts, upcoming] = await Promise.all([
    listAccounts(filter),
    filter ? listAccounts() : null,
    listUpcoming(),
  ]);
  const total = allAccounts ?? accounts;
  const pending = total.reduce((sum, a) => sum + a.pending_count, 0);

  if (total.length === 0) return <EmptyState />;

  return (
    <div className="grid gap-12 xl:grid-cols-[minmax(0,1fr)_19rem]">
      <section aria-labelledby="contas-titulo" className="min-w-0">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 id="contas-titulo" className="font-display text-page font-bold">Contas</h1>
            <p className="mt-2 text-muted">
              {pending === 0
                ? "Tudo publicado. Envie novos vídeos para encher o calendário."
                : `${pending} ${pending === 1 ? "vídeo pendente" : "vídeos pendentes"} em ${total.length} ${total.length === 1 ? "conta" : "contas"}.`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ButtonLink href="/contas/nova" variant="secondary">
              <Plus /> Nova conta
            </ButtonLink>
            <ButtonLink href="/videos/novo" variant="primary">
              <Upload /> Enviar vídeo
            </ButtonLink>
          </div>
        </div>

        <nav aria-label="Filtrar por plataforma" className="mb-6 flex flex-wrap gap-2">
          <FilterPill href="/" active={!filter}>Todas</FilterPill>
          {PLATFORMS.map((p) => (
            <FilterPill key={p} href={`/?plataforma=${p}`} active={filter === p}>
              <PlatformIcon platform={p} className="size-3.5" decorative />
              {PLATFORM_LABEL[p]}
            </FilterPill>
          ))}
        </nav>

        {accounts.length === 0 ? (
          <p className="rounded-[var(--radius-card)] border border-dashed border-border px-6 py-12 text-center text-muted">
            Nenhuma conta de {PLATFORM_LABEL[filter!]} ainda.{" "}
            <Link href="/contas/nova" className="font-semibold text-link underline-offset-4 hover:underline">
              Cadastrar conta
            </Link>
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {accounts.map((a) => (
              <AccountCard key={a.id} account={a} />
            ))}
          </div>
        )}
      </section>

      <aside aria-labelledby="proximas-titulo" className="xl:pt-[7.25rem]">
        <h2 id="proximas-titulo" className="mb-4 font-display text-card font-bold">Próximas publicações</h2>
        <UpcomingList overdue={upcoming.overdue} upcoming={upcoming.upcoming} />
      </aside>
    </div>
  );
}

function FilterPill({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-full px-4 text-meta font-semibold transition-colors",
        active ? "bg-text text-background" : "bg-surface-2 text-muted hover:text-text",
      )}
    >
      {children}
    </Link>
  );
}

function EmptyState() {
  return (
    <section className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
      <LogoHero className="mb-10" />
      <h1 className="font-display text-page font-bold">Cadastre sua primeira conta</h1>
      <p className="mt-3 text-muted">
        Cada conta do TikTok, YouTube ou Instagram ganha um calendário próprio. Depois é só enviar os vídeos e escolher o dia de cada um.
      </p>
      <ButtonLink href="/contas/nova" variant="primary" className="mt-8">
        <Plus /> Cadastrar conta
      </ButtonLink>
    </section>
  );
}
