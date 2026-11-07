import type { Metadata } from "next";
import { LogoHero } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  return (
    <main className="relative grid min-h-dvh place-items-center px-4 py-12">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="flex w-full max-w-sm flex-col items-center">
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
