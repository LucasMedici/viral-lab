"use client";

import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  CornerDownLeft,
  Film,
  History,
  LayoutGrid,
  LogOut,
  Moon,
  Plus,
  Search,
  Sun,
  Upload,
} from "lucide-react";
import { PlatformIcon } from "@/components/platform-icon";
import { StatusDot } from "@/components/status-badge";
import { Kbd } from "@/components/ui/kbd";
import { searchVideos, type VideoSearchResult } from "@/features/videos/actions";
import { PLATFORM_LABEL, STATUS_LABEL, type Platform } from "@/lib/constants";
import { rankByQuery } from "@/lib/search";
import { cn } from "@/lib/utils";

export type PaletteAccount = { id: string; platform: Platform; username: string; display_name: string };
export type PaletteRoutes = { home: string; upload: string; newAccount: string; account: string };

type Group = "Recentes" | "Ações" | "Ir para" | "Calendários" | "Vídeos";

type Icon =
  | { kind: "lucide"; name: "upload" | "plus" | "theme-light" | "theme-dark" | "logout" | "grid" | "film" | "history" }
  | { kind: "platform"; platform: Platform };

type Item = {
  id: string;
  group: Group;
  label: string;
  description?: string;
  keywords?: string[];
  icon: Icon;
  shortcut?: string[];
  status?: VideoSearchResult["status"];
  href?: string;
  run?: () => void;
  /** Itens de navegação entram em "Recentes". */
  recent?: boolean;
};

type RecentEntry = Pick<Item, "id" | "label" | "description" | "href" | "icon">;

const RECENTS_KEY = "virallab:palette-recents";
const MAX_RECENTS = 4;
const GROUP_ORDER: Group[] = ["Recentes", "Ações", "Ir para", "Calendários", "Vídeos"];

function readRecents(): RecentEntry[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENTS_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENTS) : [];
  } catch {
    return [];
  }
}

function saveRecent(entry: RecentEntry) {
  try {
    const next = [entry, ...readRecents().filter((r) => r.id !== entry.id)].slice(0, MAX_RECENTS);
    localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
  } catch {
    // Armazenamento indisponível (aba privada etc.): segue sem recentes.
  }
}

const noopSubscribe = () => () => {};
function useIsMac() {
  return useSyncExternalStore(
    noopSubscribe,
    () => /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent),
    () => false,
  );
}

/** Rótulo do atalho para abrir a busca, conforme o sistema. */
export function useOpenShortcutLabel() {
  return useIsMac() ? ["⌘", "K"] : ["Ctrl", "K"];
}

function isTypingTarget(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  return !!el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));
}

function ItemIcon({ icon }: { icon: Icon }) {
  if (icon.kind === "platform") return <PlatformIcon platform={icon.platform} className="size-4" decorative />;
  const Comp = {
    upload: Upload,
    plus: Plus,
    "theme-light": Sun,
    "theme-dark": Moon,
    logout: LogOut,
    grid: LayoutGrid,
    film: Film,
    history: History,
  }[icon.name];
  return <Comp className="size-4" strokeWidth={1.75} aria-hidden="true" />;
}

/**
 * Paleta de comandos (Ctrl+K / ⌘K): busca páginas, calendários, ações e vídeos.
 * Atalhos globais quando nenhum campo está em foco: N (enviar vídeo), T (tema),
 * G e depois C (contas), G e depois N (nova conta), "/" (abrir a busca).
 */
export function CommandPalette({
  open,
  onOpenChange,
  accounts,
  routes,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: PaletteAccount[];
  routes: PaletteRoutes;
}) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const isLight = resolvedTheme === "light";
  const toggleTheme = useCallback(() => setTheme(isLight ? "dark" : "light"), [isLight, setTheme]);

  // Atalhos globais.
  useEffect(() => {
    let pendingG = 0;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
        return;
      }
      if (open || e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return;
      if (document.querySelector("dialog[open], [aria-modal='true']")) return; // outro diálogo aberto
      const key = e.key.toLowerCase();
      if (key === "/") {
        e.preventDefault();
        onOpenChange(true);
      } else if (pendingG && Date.now() - pendingG < 1200) {
        pendingG = 0;
        if (key === "c") router.push(routes.home);
        if (key === "n") router.push(routes.newAccount);
      } else if (key === "g") {
        pendingG = Date.now();
      } else if (key === "n") {
        router.push(routes.upload);
      } else if (key === "t") {
        toggleTheme();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange, router, routes, toggleTheme]);

  if (!open) return null;
  return (
    <PaletteDialog
      onClose={() => onOpenChange(false)}
      accounts={accounts}
      routes={routes}
      isLight={isLight}
      toggleTheme={toggleTheme}
    />
  );
}

/** A janela da busca. Só existe enquanto aberta, então cada abertura começa limpa. */
function PaletteDialog({
  onClose,
  accounts,
  routes,
  isLight,
  toggleTheme,
}: {
  onClose: () => void;
  accounts: PaletteAccount[];
  routes: PaletteRoutes;
  isLight: boolean;
  toggleTheme: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [recents] = useState<RecentEntry[]>(readRecents);
  const [videoSearch, setVideoSearch] = useState<{ query: string; results: VideoSearchResult[] }>({ query: "", results: [] });
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const close = onClose;
  const trimmed = query.trim();
  const wantsVideos = trimmed.length >= 2;
  const videoResults = useMemo(() => (wantsVideos && videoSearch.query === trimmed ? videoSearch.results : []), [wantsVideos, videoSearch, trimmed]);
  const searching = wantsVideos && videoSearch.query !== trimmed;

  const signOut = useCallback(async () => {
    await fetch("/auth/signout", { method: "POST" }).catch(() => {});
    router.replace("/login");
    router.refresh();
  }, [router]);

  // Itens fixos: ações, páginas e calendários.
  const staticItems = useMemo<Item[]>(
    () => [
      { id: "action:upload", group: "Ações", label: "Enviar vídeo", keywords: ["upload", "novo vídeo", "subir"], icon: { kind: "lucide", name: "upload" }, shortcut: ["N"], href: routes.upload, recent: true },
      { id: "action:new-account", group: "Ações", label: "Cadastrar conta", keywords: ["nova conta", "adicionar", "perfil"], icon: { kind: "lucide", name: "plus" }, shortcut: ["G", "N"], href: routes.newAccount, recent: true },
      { id: "action:theme", group: "Ações", label: isLight ? "Usar tema escuro" : "Usar tema claro", keywords: ["tema", "modo", "escuro", "claro", "dark", "light"], icon: { kind: "lucide", name: isLight ? "theme-dark" : "theme-light" }, shortcut: ["T"], run: toggleTheme },
      { id: "action:signout", group: "Ações", label: "Sair", keywords: ["logout", "desconectar", "encerrar sessão"], icon: { kind: "lucide", name: "logout" }, run: signOut },
      { id: "page:home", group: "Ir para", label: "Contas", description: "Lista de contas e próximas publicações", keywords: ["início", "home", "dashboard", "visão geral"], icon: { kind: "lucide", name: "grid" }, shortcut: ["G", "C"], href: routes.home, recent: true },
      ...accounts.map<Item>((a) => ({
        id: `account:${a.id}`,
        group: "Calendários",
        label: a.display_name,
        description: `@${a.username} no ${PLATFORM_LABEL[a.platform]}`,
        keywords: [a.username, `@${a.username}`, PLATFORM_LABEL[a.platform], "calendário", "agenda"],
        icon: { kind: "platform", platform: a.platform },
        href: routes.account.replace(":id", a.id),
        recent: true,
      })),
    ],
    [accounts, routes, isLight, toggleTheme, signOut],
  );

  const videoItems = useMemo<Item[]>(
    () =>
      videoResults.map((v) => ({
        id: `video:${v.id}`,
        group: "Vídeos",
        label: v.title,
        description: v.account ? `${v.account.display_name}, @${v.account.username}` : undefined,
        icon: v.account ? { kind: "platform", platform: v.account.platform } : { kind: "lucide", name: "film" },
        status: v.status,
        href: `/videos/${v.id}`,
        recent: true,
      })),
    [videoResults],
  );

  // Lista visível, já filtrada e agrupada na ordem dos grupos.
  const items = useMemo<Item[]>(() => {
    const q = trimmed;
    const recentItems: Item[] = q
      ? []
      : recents.map((r) => ({ ...r, id: `recent:${r.id}`, group: "Recentes" as const, recent: true }));
    const ranked = rankByQuery(staticItems, q, (i) => ({ label: i.label, keywords: [...(i.keywords ?? []), i.description ?? ""] }));
    const all = [...recentItems, ...ranked, ...videoItems];
    return GROUP_ORDER.flatMap((g) => all.filter((i) => i.group === g));
  }, [trimmed, recents, staticItems, videoItems]);

  const perform = useCallback(
    (item: Item) => {
      if (item.recent && item.href) {
        saveRecent({ id: item.id.replace(/^recent:/, ""), label: item.label, description: item.description, href: item.href, icon: item.icon });
      }
      close();
      if (item.run) item.run();
      else if (item.href) router.push(item.href);
    },
    [close, router],
  );

  // Ao abrir: foco no campo e trava a rolagem da página; ao fechar, devolve o foco.
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    inputRef.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, []);

  // Busca de vídeos no servidor, com espera curta e descarte de respostas antigas.
  useEffect(() => {
    if (!wantsVideos) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      const res = await searchVideos(trimmed).catch(() => null);
      if (!cancelled) setVideoSearch({ query: trimmed, results: res && res.ok ? res.data : [] });
    }, 180);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [trimmed, wantsVideos]);

  // Item ativo sempre dentro da lista e visível.
  const current = Math.min(activeIndex, Math.max(items.length - 1, 0));
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${current}"]`)?.scrollIntoView({ block: "nearest" });
  }, [current, items]);

  const activeItem = items[current];
  const optionId = (i: number) => `${listId}-opt-${i}`;

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex(items.length ? (current + 1) % items.length : 0);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(items.length ? (current - 1 + items.length) % items.length : 0);
    } else if (e.key === "Home") {
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActiveIndex(Math.max(items.length - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeItem) perform(activeItem);
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "Tab") {
      e.preventDefault(); // o foco fica no campo de busca
    }
  }

  return (
    <div className="fixed inset-0 z-50" role="presentation">
      <button type="button" aria-label="Fechar busca" tabIndex={-1} onClick={close} className="absolute inset-0 cursor-default bg-[#0f0f14]/60" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Buscar no ViralLab"
        className="relative mx-auto mt-[12vh] flex max-h-[min(36rem,76vh)] w-[min(40rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface text-text motion-safe:animate-[palette-in_140ms_ease-out]"
      >
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search className="size-5 shrink-0 text-muted" strokeWidth={1.75} aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={onInputKeyDown}
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={activeItem ? optionId(current) : undefined}
            aria-autocomplete="list"
            placeholder="Buscar contas, vídeos e ações…"
            autoComplete="off"
            spellCheck={false}
            className="h-14 min-w-0 flex-1 bg-transparent text-card text-text outline-none placeholder:text-muted/70 focus-visible:outline-none"
          />
          <Kbd>esc</Kbd>
        </div>

        <div ref={listRef} id={listId} role="listbox" aria-label="Resultados" className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
          {items.length === 0 && !searching && (
            <div className="px-3 py-10 text-center">
              <p className="font-semibold">Nada encontrado para “{query.trim()}”</p>
              <p className="mt-1 text-meta text-muted">Tente o nome de uma conta, o título de um vídeo ou uma ação como “enviar”.</p>
            </div>
          )}

          {items.map((item, index) => {
            const header = index === 0 || items[index - 1].group !== item.group ? item.group : null;
            const active = index === current;
            return (
              <div key={item.id}>
                {header && (
                  <div role="presentation" className="px-3 pb-1.5 pt-3 text-meta font-semibold text-muted first:pt-1.5">
                    {header}
                  </div>
                )}
                <div
                  id={optionId(index)}
                  role="option"
                  aria-selected={active}
                  data-index={index}
                  onMouseMove={() => !active && setActiveIndex(index)}
                  onClick={() => perform(item)}
                  className={cn(
                    "flex h-12 cursor-pointer select-none items-center gap-3 rounded-[var(--radius-control)] px-2.5",
                    active ? "bg-accent text-accent-foreground" : "text-text",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-8 shrink-0 place-items-center rounded-[6px]",
                      active ? "bg-accent-foreground/10" : "bg-surface-2 text-muted",
                    )}
                  >
                    <ItemIcon icon={item.icon} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold leading-tight">{item.label}</span>
                    {item.description && (
                      <span className={cn("block truncate text-meta leading-tight", active ? "text-accent-foreground/70" : "text-muted")}>
                        {item.description}
                      </span>
                    )}
                  </span>
                  {item.status && (
                    <span className={cn("hidden shrink-0 items-center gap-1.5 text-meta sm:inline-flex", active ? "text-accent-foreground/80" : "text-muted")}>
                      <StatusDot status={item.status} className={active ? "ring-1 ring-accent-foreground/40" : undefined} />
                      {STATUS_LABEL[item.status]}
                    </span>
                  )}
                  {item.shortcut && (
                    <span className="hidden shrink-0 items-center gap-1 sm:flex" aria-label={`Atalho: ${item.shortcut.join(" e depois ")}`}>
                      {item.shortcut.map((k) => (
                        <Kbd key={k} className={active ? "border-accent-foreground/20 bg-accent-foreground/10 text-accent-foreground" : undefined}>
                          {k}
                        </Kbd>
                      ))}
                    </span>
                  )}
                  {active && <CornerDownLeft className="size-4 shrink-0" strokeWidth={2} aria-hidden="true" />}
                </div>
              </div>
            );
          })}

          {searching && (
            <p role="status" className="px-3 py-3 text-meta text-muted">
              Buscando vídeos…
            </p>
          )}
        </div>

        <div className="flex items-center gap-4 border-t border-border px-4 py-2.5 text-meta text-muted max-sm:hidden">
          <span className="inline-flex items-center gap-1.5">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd> navegar
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Kbd>↵</Kbd> abrir
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Kbd>esc</Kbd> fechar
          </span>
        </div>
      </div>
    </div>
  );
}
