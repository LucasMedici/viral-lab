"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { fieldErrorsFrom, type ActionResult } from "@/lib/action-result";
import { fromDateTimeLocal } from "@/lib/dates";
import { storage, videoObjectKey } from "@/lib/storage";
import { requireUser } from "@/lib/supabase/server";
import { uploadRequestSchema, videoFieldsSchema, videoUpdateSchema, type UploadRequest } from "./schema";

function fieldsFromForm(formData: FormData) {
  return {
    title: formData.get("title") ?? "",
    caption: formData.get("caption") ?? "",
    hashtags: formData.get("hashtags") ?? "",
    status: formData.get("status"),
    scheduled_at: formData.get("scheduled_at") ?? "",
    notes: formData.get("notes") ?? "",
  };
}

/** 1º passo do upload: gera a URL assinada para o navegador enviar o arquivo direto ao R2. */
export async function requestUploadUrl(
  input: UploadRequest,
): Promise<ActionResult<{ key: string; url: string; headers: Record<string, string> }>> {
  const { supabase } = await requireUser();
  const parsed = uploadRequestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Arquivo inválido" };

  // Garante que a conta existe e pertence ao usuário (RLS).
  const { data: account } = await supabase.from("accounts").select("id").eq("id", parsed.data.accountId).maybeSingle();
  if (!account) return { ok: false, error: "Conta não encontrada" };

  const key = videoObjectKey(account.id, parsed.data.fileName);
  try {
    const { url, headers } = await storage.createUploadUrl({
      key,
      contentType: parsed.data.contentType,
      size: parsed.data.size,
    });
    return { ok: true, data: { key, url, headers } };
  } catch (e) {
    console.error(e);
    return { ok: false, error: "Não foi possível preparar o envio. Confira as variáveis do R2." };
  }
}

/** 2º passo do upload: depois que o arquivo chegou ao R2, cria o registro do vídeo. */
export async function createVideo(
  file: { key: string; name: string; size: number; type: string; accountId: string },
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const parsed = videoFieldsSchema.safeParse(fieldsFromForm(formData));
  if (!parsed.success) {
    return { ok: false, error: "Revise os campos destacados.", fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }
  if (!file.key.startsWith(`videos/${file.accountId}/`)) return { ok: false, error: "Arquivo inválido" };

  const { scheduled_at, ...fields } = parsed.data;
  const { data, error } = await supabase
    .from("videos")
    .insert({
      ...fields,
      account_id: file.accountId,
      scheduled_at: fromDateTimeLocal(scheduled_at),
      file_key: file.key,
      file_name: file.name,
      file_size_bytes: file.size,
      file_mime: file.type,
      source: "upload",
    })
    .select("id")
    .single();

  if (error) {
    // Não deixa arquivo órfão no bucket.
    await storage.deleteObject(file.key).catch(() => {});
    return { ok: false, error: `Não foi possível salvar o vídeo: ${error.message}` };
  }

  revalidatePath("/", "layout");
  redirect(`/videos/${data.id}?enviado=1`);
}

/**
 * Salva a edição do vídeo. Se um link de post foi informado agora, marca como
 * publicado e devolve `justPublished` para a interface perguntar sobre o arquivo.
 */
export async function updateVideo(
  videoId: string,
  _prev: ActionResult<{ justPublished: boolean }> | null,
  formData: FormData,
): Promise<ActionResult<{ justPublished: boolean }>> {
  const { supabase } = await requireUser();
  const parsed = videoUpdateSchema.safeParse({
    ...fieldsFromForm(formData),
    published_url: formData.get("published_url") ?? "",
  });
  if (!parsed.success) {
    return { ok: false, error: "Revise os campos destacados.", fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  const { data: current, error: loadError } = await supabase
    .from("videos")
    .select("published_url, published_at, status")
    .eq("id", videoId)
    .single();
  if (loadError) return { ok: false, error: "Vídeo não encontrado" };

  const { scheduled_at, published_url, ...fields } = parsed.data;
  const justPublished = !!published_url && published_url !== current.published_url;

  const update = {
    ...fields,
    scheduled_at: fromDateTimeLocal(scheduled_at),
    published_url,
    ...(justPublished
      ? { status: "publicado" as const, published_at: current.published_at ?? new Date().toISOString() }
      : {}),
    ...(fields.status === "publicado" && !current.published_at && !justPublished
      ? { published_at: new Date().toISOString() }
      : {}),
  };

  const { error } = await supabase.from("videos").update(update).eq("id", videoId);
  if (error) return { ok: false, error: `Não foi possível salvar: ${error.message}` };

  revalidatePath("/", "layout");
  return { ok: true, data: { justPublished } };
}

/** Remove o arquivo do storage e marca file_deleted_at. O registro permanece. */
export async function deleteVideoFile(videoId: string): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { data: video } = await supabase
    .from("videos")
    .select("file_key, file_deleted_at")
    .eq("id", videoId)
    .maybeSingle();
  if (!video) return { ok: false, error: "Vídeo não encontrado" };
  if (!video.file_key || video.file_deleted_at) return { ok: true };

  try {
    await storage.deleteObject(video.file_key);
  } catch (e) {
    console.error(e);
    return { ok: false, error: "O storage recusou a exclusão. Tente de novo em instantes." };
  }

  const { error } = await supabase
    .from("videos")
    .update({ file_deleted_at: new Date().toISOString() })
    .eq("id", videoId);
  if (error) return { ok: false, error: `Arquivo apagado, mas o registro não foi atualizado: ${error.message}` };

  revalidatePath("/", "layout");
  return { ok: true };
}

/** Exclui o vídeo por completo (arquivo + registro). */
export async function deleteVideo(videoId: string): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { data: video } = await supabase
    .from("videos")
    .select("account_id, file_key, file_deleted_at")
    .eq("id", videoId)
    .maybeSingle();
  if (!video) return { ok: false, error: "Vídeo não encontrado" };

  if (video.file_key && !video.file_deleted_at) {
    try {
      await storage.deleteObject(video.file_key);
    } catch (e) {
      console.error(e);
      return { ok: false, error: "O storage recusou a exclusão do arquivo. Tente de novo." };
    }
  }

  const { error } = await supabase.from("videos").delete().eq("id", videoId);
  if (error) return { ok: false, error: `Não foi possível excluir: ${error.message}` };

  revalidatePath("/", "layout");
  redirect(`/contas/${video.account_id}`);
}

/** URL assinada temporária para baixar o arquivo. */
export async function getDownloadUrl(videoId: string): Promise<ActionResult<{ url: string }>> {
  const { supabase } = await requireUser();
  const { data: video } = await supabase
    .from("videos")
    .select("file_key, file_name, file_deleted_at, title")
    .eq("id", videoId)
    .maybeSingle();
  if (!video?.file_key || video.file_deleted_at) return { ok: false, error: "O arquivo deste vídeo já foi removido." };

  const name = video.file_name ?? `${video.title}.mp4`;
  const url = await storage.createDownloadUrl(video.file_key, name);
  return { ok: true, data: { url } };
}

/** Confere o uso real do bucket listando os objetos (operação Classe A no R2). */
export async function syncBucketUsage(): Promise<ActionResult<{ bytes: number; objects: number }>> {
  await requireUser();
  try {
    const usage = await storage.getBucketUsage();
    return { ok: true, data: usage };
  } catch (e) {
    console.error(e);
    return { ok: false, error: "Não foi possível consultar o bucket. Confira as variáveis do R2." };
  }
}

/** Descarta um upload que não virou vídeo (ex.: trocou o arquivo antes de salvar). */
export async function discardUpload(key: string): Promise<ActionResult> {
  const { supabase } = await requireUser();
  if (!/^videos\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.[a-z0-9]{1,8}$/.test(key)) return { ok: false, error: "Chave inválida" };
  const { data: account } = await supabase.from("accounts").select("id").eq("id", key.split("/")[1]).maybeSingle();
  if (!account) return { ok: false, error: "Conta não encontrada" };
  const { data: used } = await supabase.from("videos").select("id").eq("file_key", key).maybeSingle();
  if (used) return { ok: true };
  await storage.deleteObject(key).catch(() => {});
  return { ok: true };
}
