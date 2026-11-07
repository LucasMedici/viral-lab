import Link from "next/link";
import { Plus } from "lucide-react";
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
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section aria-labelledby="contas-titulo" className="min-w-0">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 id="contas-titulo" className="font-display text-3xl font-bold tracking-tight">Contas</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {pending === 0
                ? "Tudo publicado. Envie novos vídeos para encher o calendário."
                : `${pending} ${pending === 1 ? "vídeo pendente" : "vídeos pendentes"} em ${total.length} ${total.length === 1 ? "conta" : "contas"}.`}
            </p>
          </div>
          <ButtonLink href="/contas/nova" variant="secondary" size="sm">
            <Plus /> Nova conta
          </ButtonLink>
        </div>

        <nav aria-label="Filtrar por plataforma" className="mb-5 flex flex-wrap gap-1.5">
          <FilterChip href="/" active={!filter}>Todas</FilterChip>
          {PLATFORMS.map((p) => (
            <FilterChip key={p} href={`/?plataforma=${p}`} active={filter === p}>
              <PlatformIcon platform={p} className="size-3.5" colored={filter !== p} />
              {PLATFORM_LABEL[p]}
            </FilterChip>
          ))}
        </nav>

        {accounts.length === 0 ? (
          <p className="rounded-[var(--radius-lg)] border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">
            Nenhuma conta de {PLATFORM_LABEL[filter!]} ainda.{" "}
            <Link href="/contas/nova" className="font-medium text-primary underline-offset-4 hover:underline">
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

      <aside aria-labelledby="proximas-titulo" className="lg:pt-[4.25rem]">
        <h2 id="proximas-titulo" className="mb-3 font-display text-lg font-semibold tracking-tight">
          Próximas publicações
        </h2>
        <UpcomingList overdue={upcoming.overdue} upcoming={upcoming.upcoming} />
      </aside>
    </div>
  );
}

function FilterChip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition-colors",
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-surface text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}

function EmptyState() {
  return (
    <section className="mx-auto flex max-w-xl flex-col items-start py-12">
      <div className="mb-8 flex gap-2" aria-hidden="true">
        {PLATFORMS.map((p) => (
          <span key={p} className="grid size-12 place-items-center rounded-[var(--radius-md)] border border-border bg-surface">
            <PlatformIcon platform={p} className="size-6" />
          </span>
        ))}
      </div>
      <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight">
        Cadastre sua primeira conta
      </h1>
      <p className="mt-4 text-base text-muted-foreground">
        Cada conta do TikTok, YouTube ou Instagram ganha um calendário próprio. Depois é só enviar os vídeos e escolher o dia de cada um.
      </p>
      <ButtonLink href="/contas/nova" className="mt-8">
        <Plus /> Cadastrar conta
      </ButtonLink>
    </section>
  );
}
