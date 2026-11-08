import "server-only";
import { freeTierBytes, storageHardLimitBytes } from "@/lib/env";
import { requireUser } from "@/lib/supabase/server";
import { sumStoredBytes } from "./storage-limit";

export async function getVideo(id: string) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("videos")
    .select("*, account:accounts(id, platform, username, display_name)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Não foi possível carregar o vídeo: ${error.message}`);
  return data;
}

const CAL_FIELDS = "id, title, status, scheduled_at, file_deleted_at, hashtags" as const;

/** Vídeos agendados no intervalo [start, end) de uma conta. */
export async function listScheduledVideos(accountId: string, startISO: string, endISO: string) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("videos")
    .select(CAL_FIELDS)
    .eq("account_id", accountId)
    .gte("scheduled_at", startISO)
    .lt("scheduled_at", endISO)
    .order("scheduled_at");
  if (error) throw new Error(`Não foi possível carregar o calendário: ${error.message}`);
  return data;
}

export async function listUnscheduledVideos(accountId: string) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("videos")
    .select(CAL_FIELDS)
    .eq("account_id", accountId)
    .is("scheduled_at", null)
    .neq("status", "publicado")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Não foi possível carregar os vídeos sem data: ${error.message}`);
  return data;
}

export type CalendarVideo = Awaited<ReturnType<typeof listUnscheduledVideos>>[number];

/** Próximos vídeos (e atrasados) de todas as contas, para a tela inicial. */
export async function listUpcoming(limit = 6) {
  const { supabase } = await requireUser();
  const nowISO = new Date().toISOString();
  const select = "id, title, status, scheduled_at, account:accounts(id, platform, username, display_name)";
  const [overdue, upcoming] = await Promise.all([
    supabase
      .from("videos")
      .select(select)
      .neq("status", "publicado")
      .lt("scheduled_at", nowISO)
      .order("scheduled_at")
      .limit(limit),
    supabase
      .from("videos")
      .select(select)
      .neq("status", "publicado")
      .gte("scheduled_at", nowISO)
      .order("scheduled_at")
      .limit(limit),
  ]);
  if (overdue.error) throw new Error(overdue.error.message);
  if (upcoming.error) throw new Error(upcoming.error.message);
  return { overdue: overdue.data, upcoming: upcoming.data };
}

/** Uso do bucket estimado pelo banco (soma dos arquivos ainda não apagados). Custo zero. */
export async function getStorageUsage() {
  const { supabase } = await requireUser();
  const { bytes, files } = await sumStoredBytes(supabase);
  return { bytes, files, limit: freeTierBytes(), hardLimit: storageHardLimitBytes() };
}
