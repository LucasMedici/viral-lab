import Link from "next/link";
import { PlatformIcon } from "@/components/platform-icon";
import { PLATFORM_FORMAT, PLATFORM_LABEL } from "@/lib/constants";
import type { AccountOverview } from "@/types/database";

export function AccountCard({ account }: { account: AccountOverview }) {
  const pending = account.pending_count;
  return (
    <article className="group relative flex flex-col rounded-[var(--radius-lg)] border border-border bg-surface transition-colors hover:border-primary/50">
      <div className="flex items-start gap-3 p-5 pb-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-md)] bg-surface-muted">
          <PlatformIcon platform={account.platform} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-display text-lg font-semibold leading-tight tracking-tight">
            <Link href={`/contas/${account.id}`} className="after:absolute after:inset-0 focus-visible:outline-none">
              {account.display_name}
            </Link>
          </h2>
          <p className="truncate text-sm text-muted-foreground">
            @{account.username} <span className="sr-only">no {PLATFORM_LABEL[account.platform]}</span>
          </p>
        </div>
        <Link
          href={`/contas/${account.id}/editar`}
          className="relative z-10 rounded-[var(--radius-sm)] px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-surface-muted hover:text-foreground"
        >
          Editar
        </Link>
      </div>

      <div className="mt-auto flex items-end justify-between gap-3 border-t border-border px-5 py-4">
        <div className="min-w-0">
          {account.niche ? (
            <span className="inline-block max-w-full truncate rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              {account.niche}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">Sem nicho</span>
          )}
        </div>
        <p className="text-right leading-none">
          <span className={pending > 0 ? "font-display text-3xl font-bold tracking-tight text-foreground" : "font-display text-3xl font-bold tracking-tight text-muted-foreground/50"}>
            {pending}
          </span>
          <span className="mt-1 block text-xs text-muted-foreground">
            {pending === 1 ? `${PLATFORM_FORMAT[account.platform]} pendente` : `${PLATFORM_FORMAT[account.platform]}s pendentes`}
          </span>
        </p>
      </div>
    </article>
  );
}
