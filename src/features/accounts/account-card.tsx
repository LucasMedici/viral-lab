import Link from "next/link";
import { PlatformIcon } from "@/components/platform-icon";
import { PLATFORM_FORMAT, PLATFORM_LABEL } from "@/lib/constants";
import type { AccountOverview } from "@/types/database";

export function AccountCard({ account }: { account: AccountOverview }) {
  const pending = account.pending_count;
  const format = PLATFORM_FORMAT[account.platform];
  return (
    <article className="group relative flex min-w-0 flex-col rounded-[var(--radius-card)] border border-border bg-surface transition-colors hover:border-muted/50">
      <div className="flex items-start gap-3 p-5">
        <span className="grid size-11 shrink-0 place-items-center rounded-[var(--radius-control)] bg-surface-2">
          <PlatformIcon platform={account.platform} className="size-5" decorative />
        </span>
        <div className="min-w-0 flex-1 pt-0.5">
          <h2 className="truncate font-display text-card font-medium leading-tight">
            <Link href={`/contas/${account.id}`} className="after:absolute after:inset-0 after:rounded-[var(--radius-card)]">
              {account.display_name}
            </Link>
          </h2>
          <p className="mt-0.5 truncate text-meta text-muted">
            @{account.username}
            <span className="sr-only"> no {PLATFORM_LABEL[account.platform]}</span>
          </p>
        </div>
        <Link
          href={`/contas/${account.id}/editar`}
          className="relative z-10 -mr-1 -mt-1 rounded-full px-2.5 py-1 text-meta font-semibold text-muted transition-colors after:absolute after:-inset-x-1 after:-inset-y-2 hover:bg-surface-2 hover:text-text"
        >
          Editar
        </Link>
      </div>

      <div className="mt-auto flex items-end justify-between gap-3 px-5 pb-5">
        {account.niche ? (
          <span className="max-w-[60%] truncate rounded-full bg-surface-2 px-2.5 py-1 text-meta text-muted">{account.niche}</span>
        ) : (
          <span className="text-meta text-muted/70">Sem nicho</span>
        )}
        <p className="text-right">
          <span className={pending > 0 ? "block font-display text-page font-bold leading-none tracking-[-0.02em]" : "block font-display text-page font-bold leading-none tracking-[-0.02em] text-muted/40"}>
            {pending}
          </span>
          <span className="mt-1.5 block text-meta text-muted">
            {pending === 1 ? `${format} pendente` : `${format}s pendentes`}
          </span>
        </p>
      </div>
    </article>
  );
}
