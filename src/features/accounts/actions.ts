"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { fieldErrorsFrom, type ActionResult } from "@/lib/action-result";
import { requireUser } from "@/lib/supabase/server";
import { accountSchema } from "./schema";

function formToObject(formData: FormData) {
  return {
    platform: formData.get("platform"),
    username: formData.get("username") ?? "",
    display_name: formData.get("display_name") ?? "",
    niche: formData.get("niche") ?? "",
    description: formData.get("description") ?? "",
  };
}

export async function saveAccount(
  accountId: string | null,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const parsed = accountSchema.safeParse(formToObject(formData));
  if (!parsed.success) {
    return { ok: false, error: "Revise os campos destacados.", fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  const values = parsed.data;
  const { data, error } = accountId
    ? await supabase.from("accounts").update(values).eq("id", accountId).select("id").single()
    : await supabase.from("accounts").insert(values).select("id").single();

  if (error) {
    if (error.code === "23505") {
      return {
        ok: false,
        error: "Já existe uma conta com esse @ nessa plataforma.",
        fieldErrors: { username: "Esse @ já está cadastrado nessa plataforma" },
      };
    }
    return { ok: false, error: `Não foi possível salvar a conta: ${error.message}` };
  }

  revalidatePath("/", "layout");
  redirect(`/contas/${data.id}`);
}

export async function deleteAccount(accountId: string): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("accounts").delete().eq("id", accountId);
  if (error) {
    if (error.code === "23503") {
      return { ok: false, error: "Essa conta ainda tem vídeos. Exclua ou mova os vídeos antes de excluir a conta." };
    }
    return { ok: false, error: `Não foi possível excluir a conta: ${error.message}` };
  }
  revalidatePath("/", "layout");
  redirect("/");
}
