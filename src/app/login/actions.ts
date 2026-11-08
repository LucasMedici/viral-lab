"use server";

import { redirect } from "next/navigation";
import type { ActionResult } from "@/lib/action-result";
import { isAllowedUser } from "@/lib/auth/owner";
import { safeNextPath } from "@/lib/safe-redirect";
import { createClient } from "@/lib/supabase/server";

export async function signIn(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/");

  if (!email || !password) return { ok: false, error: "Informe email e senha." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (!error && !isAllowedUser(data.user)) {
    await supabase.auth.signOut();
    return { ok: false, error: "Este usuário não tem acesso ao ViralLab." };
  }
  if (error) {
    return {
      ok: false,
      error: error.status === 400 ? "Email ou senha incorretos." : `Não foi possível entrar: ${error.message}`,
    };
  }

  // Só redireciona para caminhos internos (bloqueia "/\evil.com", "//evil.com" etc.).
  redirect(safeNextPath(next));
}
