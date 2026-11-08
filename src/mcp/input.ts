import { z } from "zod";
import { PLATFORMS } from "@/lib/constants";
import { fromDateTimeLocal } from "@/lib/dates";
import { parseHashtags } from "@/lib/utils";

/**
 * Schemas de entrada das ferramentas do MCP e regras puras (testáveis).
 * Sem `transform` nos schemas: eles viram JSON Schema para o Claude, então a
 * normalização acontece no código, depois da validação.
 */

/** Status que o MCP pode definir. "publicado" fica no app, junto do link do post. */
export const MCP_STATUSES = ["gerado", "aprovado", "agendado"] as const;

const dateTimeLocal = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Use o formato AAAA-MM-DDTHH:mm, no horário de Brasília");

export const fieldsShape = {
  titulo: z.string().trim().min(1, "Dê um título").max(200, "Título com no máximo 200 caracteres").describe("Título interno do vídeo (até 200 caracteres)."),
  legenda: z.string().max(5000, "Legenda com no máximo 5000 caracteres").describe("Legenda/descrição do post, sem as hashtags.").optional(),
  hashtags: z.array(z.string().max(100)).max(60, "No máximo 60 hashtags").describe('Hashtags sem o "#", ex.: ["receitas", "fitness"].').optional(),
  agendado_para: dateTimeLocal.describe('Data e hora da publicação no horário de Brasília, ex.: "2026-11-10T19:00".').optional(),
  status: z.enum(MCP_STATUSES).describe('Padrão: "agendado" se houver data, senão "aprovado".').optional(),
  notas: z.string().max(5000).describe("Anotações internas (não vão para o post).").optional(),
  arquivo: z.string().min(1).describe("Caminho completo do arquivo de vídeo no PC, ex.: C:\\Users\\voce\\Videos\\01.mp4. O envio ao storage acontece em segundo plano.").optional(),
};

export const videoItemSchema = z.object({
  conta: z.string().trim().min(1).describe('Conta de destino: o id (de listar_contas) ou "@usuario". Se o mesmo @ existir em duas plataformas, use "tiktok:@usuario".'),
  ...fieldsShape,
});

export type VideoItem = z.infer<typeof videoItemSchema>;

/** Hashtags normalizadas: sem "#", sem repetidas, sem vazias. */
export function normalizeHashtags(tags: string[] | undefined): string[] {
  return parseHashtags(tags ?? []).slice(0, 60);
}

/** Texto opcional: vazio vira null. */
export function optionalText(value: string | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  const v = value.trim();
  return v === "" ? null : v;
}

/** Converte "AAAA-MM-DDTHH:mm" (Brasília) em ISO UTC, validando a data. */
export function scheduledISO(value: string): string {
  const iso = fromDateTimeLocal(value);
  const d = iso ? new Date(iso) : null;
  if (!iso || !d || Number.isNaN(d.getTime())) throw new Error(`Data inválida: "${value}"`);
  // Rejeita datas que "transbordam" (ex.: 2026-02-31 vira 03/03).
  const [datePart] = value.split("T");
  const [y, m, day] = datePart.split("-").map(Number);
  if (m < 1 || m > 12 || day < 1 || day > new Date(Date.UTC(y, m, 0)).getUTCDate()) {
    throw new Error(`Data inválida: "${value}"`);
  }
  return iso;
}

/** Status padrão: quem dá o OK na conversa já aprovou o vídeo. */
export function defaultStatus(hasSchedule: boolean): (typeof MCP_STATUSES)[number] {
  return hasSchedule ? "agendado" : "aprovado";
}

export type AccountRef = { id: string; platform: string; username: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Encontra a conta por id, "@usuario", "usuario" ou "plataforma:@usuario".
 * Lança erro com as opções quando não encontra ou quando o @ é ambíguo.
 */
export function resolveAccount<T extends AccountRef>(ref: string, accounts: T[]): T {
  const value = ref.trim();
  if (UUID.test(value)) {
    const byId = accounts.find((a) => a.id.toLowerCase() === value.toLowerCase());
    if (byId) return byId;
    throw new Error(`Conta não encontrada: ${value}`);
  }

  const m = /^(?:([a-z]+)\s*[:/]\s*)?@?([^\s@]+)$/i.exec(value);
  if (!m) throw new Error(`Conta inválida: "${ref}". Use o id ou "@usuario".`);
  const platform = m[1]?.toLowerCase();
  if (platform && !(PLATFORMS as readonly string[]).includes(platform)) {
    throw new Error(`Plataforma desconhecida "${m[1]}". Use tiktok, youtube ou instagram.`);
  }
  const username = m[2].toLowerCase();
  const matches = accounts.filter(
    (a) => a.username.toLowerCase() === username && (!platform || a.platform === platform),
  );
  if (matches.length === 1) return matches[0];

  const options = accounts.map((a) => `${a.platform}:@${a.username}`).join(", ") || "nenhuma conta cadastrada";
  if (matches.length > 1) {
    throw new Error(`"@${username}" existe em mais de uma plataforma. Use, por exemplo, "${matches[0].platform}:@${username}".`);
  }
  throw new Error(`Conta "${ref}" não encontrada. Contas disponíveis: ${options}.`);
}

/** Chave que identifica um vídeo repetido: mesma conta, mesmo título, mesma data. */
export function duplicateKey(accountId: string, title: string, scheduledAt: string | null): string {
  const when = scheduledAt ? new Date(scheduledAt).toISOString() : "";
  return `${accountId}|${title.trim().toLowerCase()}|${when}`;
}
