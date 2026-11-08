import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { listAccountOptions } from "@/features/accounts/queries";
import { getStorageUsage } from "@/features/videos/queries";
import { UploadForm } from "@/features/videos/upload-form";
import { formatBytes } from "@/lib/utils";

export const metadata: Metadata = { title: "Enviar vídeo" };

export default async function UploadPage({ searchParams }: PageProps<"/videos/novo">) {
  const { conta } = await searchParams;
  const [accounts, usage] = await Promise.all([listAccountOptions(), getStorageUsage()]);
  const remaining = Math.max(usage.hardLimit - usage.bytes, 0);
  const defaultAccountId = typeof conta === "string" && accounts.some((a) => a.id === conta) ? conta : undefined;
  const back = defaultAccountId ? `/contas/${defaultAccountId}` : "/";

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href={back} className="text-meta text-muted hover:text-text">Voltar</Link>
        <h1 className="mt-2 font-display text-page font-bold">Enviar vídeo</h1>
      </div>
      {remaining === 0 && (
        <p role="alert" className="max-w-2xl rounded-[var(--radius-card)] border border-danger/40 bg-danger/10 px-4 py-3 text-text">
          O limite de armazenamento do app ({formatBytes(usage.hardLimit)}) foi atingido e novos envios estão bloqueados. Apague os
          arquivos de vídeos já publicados (na tela de cada vídeo, botão “Apagar arquivo”) para liberar espaço.
        </p>
      )}
      {accounts.length === 0 ? (
        <div className="max-w-md">
          <p className="text-muted">Para enviar um vídeo, cadastre antes a conta onde ele será publicado.</p>
          <ButtonLink href="/contas/nova" variant="primary" className="mt-6">Cadastrar conta</ButtonLink>
        </div>
      ) : (
        <UploadForm accounts={accounts} defaultAccountId={defaultAccountId} remainingBytes={remaining} />
      )}
    </div>
  );
}
