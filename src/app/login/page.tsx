import type { Metadata } from "next";
import { Logo } from "@/components/logo";
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
      <div className="w-full max-w-sm">
        <Logo className="mb-10" />
        <h1 className="font-display text-3xl font-bold tracking-tight">Entrar</h1>
        <p className="mb-8 mt-2 text-sm text-muted-foreground">
          Acesso restrito. Use o email e a senha cadastrados no Supabase.
        </p>
        <LoginForm next={typeof next === "string" ? next : "/"} />
      </div>
    </main>
  );
}
