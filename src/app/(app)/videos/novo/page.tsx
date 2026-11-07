import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { listAccountOptions } from "@/features/accounts/queries";
import { UploadForm } from "@/features/videos/upload-form";

export const metadata: Metadata = { title: "Enviar vídeo" };

export default async function UploadPage({ searchParams }: PageProps<"/videos/novo">) {
  const { conta } = await searchParams;
  const accounts = await listAccountOptions();
  const defaultAccountId = typeof conta === "string" && accounts.some((a) => a.id === conta) ? conta : undefined;
  const back = defaultAccountId ? `/contas/${defaultAccountId}` : "/";

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href={back} className="text-sm text-muted-foreground hover:text-foreground">Voltar</Link>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">Enviar vídeo</h1>
      </div>
      {accounts.length === 0 ? (
        <div className="max-w-md">
          <p className="text-muted-foreground">Para enviar um vídeo, cadastre antes a conta onde ele será publicado.</p>
          <ButtonLink href="/contas/nova" className="mt-6">Cadastrar conta</ButtonLink>
        </div>
      ) : (
        <UploadForm accounts={accounts} defaultAccountId={defaultAccountId} />
      )}
    </div>
  );
}
