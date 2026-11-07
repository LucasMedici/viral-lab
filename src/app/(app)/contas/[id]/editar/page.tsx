import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AccountForm } from "@/features/accounts/account-form";
import { getAccount } from "@/features/accounts/queries";

export const metadata: Metadata = { title: "Editar conta" };

export default async function EditAccountPage({ params }: PageProps<"/contas/[id]/editar">) {
  const { id } = await params;
  const account = await getAccount(id);
  if (!account) notFound();
  return (
    <div className="mx-auto max-w-2xl">
      <Link href={`/contas/${account.id}`} className="text-meta text-muted hover:text-text">
        {account.display_name}
      </Link>
      <h1 className="mb-8 mt-2 font-display text-page font-bold">Editar conta</h1>
      <AccountForm account={account} />
    </div>
  );
}
