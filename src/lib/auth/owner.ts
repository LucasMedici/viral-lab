import type { User } from "@supabase/supabase-js";

/**
 * O ViralLab é de um único dono. Além do cadastro público desligado no
 * Supabase, o app recusa:
 * - usuários anônimos (caso "anonymous sign-ins" seja ligado por engano);
 * - qualquer email diferente de OWNER_EMAIL, quando essa variável estiver definida.
 */
export function isAllowedUser(user: Pick<User, "email" | "is_anonymous"> | null | undefined): boolean {
  if (!user || user.is_anonymous) return false;
  const owner = process.env.OWNER_EMAIL?.trim().toLowerCase();
  if (!owner) return true;
  return user.email?.trim().toLowerCase() === owner;
}
