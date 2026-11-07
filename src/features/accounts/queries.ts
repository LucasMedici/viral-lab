import "server-only";
import { requireUser } from "@/lib/supabase/server";
import type { Platform } from "@/lib/constants";

export async function listAccounts(platform?: Platform) {
  const { supabase } = await requireUser();
  let query = supabase.from("account_overview").select("*").order("display_name");
  if (platform) query = query.eq("platform", platform);
  const { data, error } = await query;
  if (error) throw new Error(`Não foi possível carregar as contas: ${error.message}`);
  return data;
}

export async function getAccount(id: string) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.from("account_overview").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`Não foi possível carregar a conta: ${error.message}`);
  return data;
}

export async function listAccountOptions() {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("accounts")
    .select("id, platform, username, display_name")
    .order("display_name");
  if (error) throw new Error(`Não foi possível carregar as contas: ${error.message}`);
  return data;
}

export type AccountOption = Awaited<ReturnType<typeof listAccountOptions>>[number];
