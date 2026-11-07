import type { Metadata } from "next";
import Link from "next/link";
import { AccountForm } from "@/features/accounts/account-form";

export const metadata: Metadata = { title: "Nova conta" };

export default function NewAccountPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">Contas</Link>
      <h1 className="mb-8 mt-2 font-display text-3xl font-bold tracking-tight">Nova conta</h1>
      <AccountForm />
    </div>
  );
}
