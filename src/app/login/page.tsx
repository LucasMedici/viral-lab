import type { Metadata } from "next";
import { LogoHero } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  return (
    // Fixo na janela visível: fica centralizado mesmo que algo estoure a largura da página.
    <main className="fixed inset-0 overflow-y-auto">
      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>
      <div className="mx-auto flex min-h-full w-full max-w-sm flex-col items-center justify-center px-4 py-16">
        <LogoHero className="mb-10" />
        <div className="w-full rounded-[var(--radius-card)] border border-border bg-surface p-6 sm:p-8">
          <h1 className="font-display text-section font-bold">Entrar</h1>
          <p className="mb-6 mt-1.5 text-meta text-muted">Acesso restrito ao dono do ViralLab.</p>
          <LoginForm next={typeof next === "string" ? next : "/"} />
        </div>
      </div>
    </main>
  );
}
