import type { Metadata } from "next";
import { LogoHero } from "@/components/logo";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "Página não encontrada" };

/** 404 global (rotas fora do app, ex.: links antigos). */
export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-16">
      <div className="flex max-w-md flex-col items-center text-center">
        <LogoHero className="mb-10" />
        <h1 className="font-display text-page font-bold">Página não encontrada</h1>
        <p className="mt-3 text-muted">Esse endereço não existe ou foi removido. Volte para as suas contas para continuar.</p>
        <ButtonLink href="/" variant="primary" className="mt-8">
          Ir para as contas
        </ButtonLink>
      </div>
    </main>
  );
}
