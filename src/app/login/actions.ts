"use server";

import { redirect } from "next/navigation";
import type { ActionResult } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";

export async function signIn(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/");

  if (!email || !password) return { ok: false, error: "Informe email e senha." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return {
      ok: false,
      error: error.status === 400 ? "Email ou senha incorretos." : `Não foi possível entrar: ${error.message}`,
    };
  }

  // Só redireciona para caminhos internos.
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/");
}
