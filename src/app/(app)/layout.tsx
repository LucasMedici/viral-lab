import Link from "next/link";
import { LogOut, Plus } from "lucide-react";
import { Logo } from "@/components/logo";
import { StorageUsage } from "@/components/storage-usage";
import { ThemeToggle } from "@/components/theme-toggle";
import { ButtonLink } from "@/components/ui/button";
import { getStorageUsage } from "@/features/videos/queries";
import { requireUser } from "@/lib/supabase/server";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  await requireUser();
  const usage = await getStorageUsage();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4 sm:gap-4">
          <Link href="/" aria-label="ViralLab, ir para contas" className="mr-auto rounded-[var(--radius-sm)]">
            <Logo />
          </Link>
          <StorageUsage bytes={usage.bytes} files={usage.files} limit={usage.limit} />
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          <ButtonLink href="/videos/novo" size="sm">
            <Plus />
            <span className="hidden sm:inline">Enviar vídeo</span>
            <span className="sr-only sm:hidden">Enviar vídeo</span>
          </ButtonLink>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              title="Sair"
              aria-label="Sair"
              className="grid size-8 place-items-center rounded-[var(--radius-md)] text-muted-foreground hover:bg-surface-muted hover:text-foreground"
            >
              <LogOut className="size-4" />
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-8">{children}</main>
      <footer className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 pb-6 text-xs text-muted-foreground sm:hidden">
        <span>Tema</span>
        <ThemeToggle />
      </footer>
    </div>
  );
}
