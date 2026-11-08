"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutGrid, LogOut, Menu, Plus, Upload, X } from "lucide-react";
import { Logo } from "@/components/logo";
import { PlatformIcon } from "@/components/platform-icon";
import { StorageUsage } from "@/components/storage-usage";
import { ThemeToggle } from "@/components/theme-toggle";
import { PLATFORM_LABEL, type Platform } from "@/lib/constants";
import { cn } from "@/lib/utils";

export type ShellAccount = {
  id: string;
  platform: Platform;
  username: string;
  display_name: string;
  pending_count: number;
};

/** Destinos dos links. Em produção usa as rotas reais; o preview pode sobrescrever. */
export type ShellRoutes = {
  home: string;
  upload: string;
  newAccount: string;
  /** Use ":id" como marcador do id da conta. */
  account: string;
};

const DEFAULT_ROUTES: ShellRoutes = {
  home: "/",
  upload: "/videos/novo",
  newAccount: "/contas/nova",
  account: "/contas/:id",
};

type ActiveKey = "home" | "upload" | "newAccount" | `account:${string}` | null;

function activeFromPath(pathname: string): ActiveKey {
  if (pathname === "/") return "home";
  if (pathname === "/videos/novo") return "upload";
  if (pathname === "/contas/nova") return "newAccount";
  const m = /^\/contas\/([^/]+)/.exec(pathname);
  if (m) return `account:${m[1]}`;
  return null;
}

/**
 * Estrutura do app: menu lateral fixo à esquerda (desktop) ou gaveta (celular),
 * com navegação, calendários das contas, armazenamento, tema e sair.
 */
export function AppShell({
  accounts,
  usage,
  routes = DEFAULT_ROUTES,
  active: activeOverride,
  children,
}: {
  accounts: ShellAccount[];
  usage: { bytes: number; files: number; limit: number };
  routes?: ShellRoutes;
  active?: ActiveKey;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = activeOverride !== undefined ? activeOverride : activeFromPath(pathname);
  const [open, setOpen] = useState(false);

  // A gaveta fecha ao clicar num link (onNavigate) e com Esc.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const sidebar = (
    <SidebarContent
      accounts={accounts}
      usage={usage}
      routes={routes}
      active={active}
      onNavigate={() => setOpen(false)}
    />
  );

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[16.5rem_minmax(0,1fr)]">
      {/* Desktop: menu fixo */}
      <aside className="sticky top-0 hidden h-dvh border-r border-border bg-surface lg:block">{sidebar}</aside>

      {/* Celular: barra superior + gaveta */}
      <div className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-surface/90 px-3 backdrop-blur-md lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir menu"
          aria-expanded={open}
          className="-ml-1 grid size-11 place-items-center rounded-[var(--radius-control)] text-text transition-colors hover:bg-surface-2"
        >
          <Menu className="size-5" strokeWidth={2} />
        </button>
        <Link href={routes.home} aria-label="ViralLab, ir para contas">
          <Logo />
        </Link>
      </div>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button type="button" aria-label="Fechar menu" className="absolute inset-0 bg-[#0f0f14]/60" onClick={() => setOpen(false)} />
          <aside className="relative h-full w-[min(18rem,85vw)] border-r border-border bg-surface">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fechar menu"
              className="absolute right-2.5 top-2.5 grid size-11 place-items-center rounded-[var(--radius-control)] text-muted transition-colors hover:bg-surface-2 hover:text-text"
            >
              <X className="size-5" strokeWidth={2} />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <main className="min-w-0 px-4 pb-20 pt-8 sm:px-6 lg:px-10 lg:pt-10">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>
    </div>
  );
}

function SidebarContent({
  accounts,
  usage,
  routes,
  active,
  onNavigate,
}: {
  accounts: ShellAccount[];
  usage: { bytes: number; files: number; limit: number };
  routes: ShellRoutes;
  active: ActiveKey;
  onNavigate: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center px-5">
        <Link href={routes.home} onClick={onNavigate} aria-label="ViralLab, ir para contas" className="rounded-[var(--radius-control)]">
          <Logo priority />
        </Link>
      </div>

      <nav aria-label="Principal" className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-3 pb-4 pt-2">
        <ul className="flex flex-col gap-0.5">
          <NavItem href={routes.home} active={active === "home"} onClick={onNavigate} icon={<LayoutGrid />}>
            Contas
          </NavItem>
          <NavItem href={routes.upload} active={active === "upload"} onClick={onNavigate} icon={<Upload />}>
            Enviar vídeo
          </NavItem>
        </ul>

        <div>
          <h2 className="mb-1.5 px-3 text-meta font-semibold text-muted">Calendários</h2>
          <ul className="flex flex-col gap-0.5">
            {accounts.map((a) => (
              <NavItem
                key={a.id}
                href={routes.account.replace(":id", a.id)}
                active={active === `account:${a.id}`}
                onClick={onNavigate}
                icon={<PlatformIcon platform={a.platform} className="size-4" />}
                badge={a.pending_count > 0 ? a.pending_count : undefined}
                title={`${a.display_name} (@${a.username} no ${PLATFORM_LABEL[a.platform]})`}
              >
                {a.display_name}
              </NavItem>
            ))}
            <NavItem href={routes.newAccount} active={active === "newAccount"} onClick={onNavigate} icon={<Plus />} muted>
              Nova conta
            </NavItem>
          </ul>
        </div>
      </nav>

      <div className="flex shrink-0 flex-col gap-2 border-t border-border p-3">
        <StorageUsage bytes={usage.bytes} files={usage.files} limit={usage.limit} />
        <div className="flex items-center justify-between gap-2 px-1">
          <ThemeToggle />
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-control)] px-3 text-meta font-semibold text-muted transition-colors hover:bg-surface-2 hover:text-text"
            >
              <LogOut className="size-4" strokeWidth={2} />
              Sair
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function NavItem({
  href,
  active,
  onClick,
  icon,
  badge,
  title,
  muted = false,
  children,
}: {
  href: string;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  badge?: number;
  title?: string;
  muted?: boolean;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        onClick={onClick}
        title={title}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex h-10 items-center gap-2.5 rounded-[var(--radius-control)] px-3 transition-colors [&_svg]:size-4 [&_svg]:shrink-0",
          // Traço do ícone acompanha o peso do texto: 2px no ativo (semibold), 1.75px nos demais (regular).
          active
            ? "bg-surface-2 font-semibold text-text [&_svg.lucide]:stroke-2"
            : cn("hover:bg-surface-2 hover:text-text [&_svg.lucide]:stroke-[1.75]", muted ? "text-muted" : "text-text/85"),
        )}
      >
        <span className={cn("grid place-items-center", !active && "text-muted")}>{icon}</span>
        <span className="min-w-0 flex-1 truncate">{children}</span>
        {badge !== undefined && (
          <span
            className={cn(
              "grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[0.6875rem] font-semibold tabular-nums",
              active ? "bg-surface text-text" : "bg-surface-2 text-muted",
            )}
            aria-label={`${badge} pendentes`}
          >
            {badge}
          </span>
        )}
      </Link>
    </li>
  );
}
