import Link from "next/link";
import { LogOut } from "lucide-react";
import { Logo } from "@/components/logo";
import { MainNav } from "@/components/main-nav";
import { StorageUsage } from "@/components/storage-usage";
import { ThemeToggle } from "@/components/theme-toggle";
import { getStorageUsage } from "@/features/videos/queries";
import { requireUser } from "@/lib/supabase/server";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  await requireUser();
  const usage = await getStorageUsage();

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="sticky top-0 z-30 px-3 pt-3 sm:px-4">
        <header className="mx-auto flex h-14 max-w-6xl items-center gap-2 rounded-[var(--radius-card)] border border-border bg-surface/90 pl-4 pr-2 backdrop-blur-md sm:gap-3">
          <Link href="/" aria-label="ViralLab, ir para contas" className="mr-2 shrink-0 rounded-[var(--radius-control)] py-2 sm:mr-4">
            <Logo priority />
          </Link>
          <MainNav />
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <StorageUsage bytes={usage.bytes} files={usage.files} limit={usage.limit} />
            <ThemeToggle className="max-md:hidden" />
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                title="Sair"
                aria-label="Sair"
                className="grid size-9 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-text"
              >
                <LogOut className="size-4" strokeWidth={2} />
              </button>
            </form>
          </div>
        </header>
      </div>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-20 pt-10 sm:px-5">{children}</main>
      <footer className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 pb-6 text-meta text-muted md:hidden">
        <span>Tema</span>
        <ThemeToggle />
      </footer>
    </div>
  );
}
