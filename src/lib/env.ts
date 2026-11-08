import "server-only";
import { z } from "zod";

/**
 * Variáveis de ambiente só do servidor, validadas na primeira leitura (lazy),
 * para que o `next build` do CI rode sem credenciais reais.
 */
const serverSchema = z.object({
  R2_ACCOUNT_ID: z.string().min(1, "R2_ACCOUNT_ID não definido"),
  R2_ACCESS_KEY_ID: z.string().min(1, "R2_ACCESS_KEY_ID não definido"),
  R2_SECRET_ACCESS_KEY: z.string().min(1, "R2_SECRET_ACCESS_KEY não definido"),
  R2_BUCKET: z.string().min(1).default("viral-lab"),
  R2_FREE_TIER_BYTES: z.coerce.number().positive().default(10 * 1024 ** 3),
});

export type ServerEnv = z.infer<typeof serverSchema>;

let cached: ServerEnv | undefined;

export function serverEnv(): ServerEnv {
  if (!cached) {
    const parsed = serverSchema.safeParse(process.env);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => `- ${i.message}`).join("\n");
      throw new Error(`Variáveis de ambiente inválidas:\n${issues}\nVeja .env.example.`);
    }
    cached = parsed.data;
  }
  return cached;
}

export function freeTierBytes(): number {
  const raw = Number(process.env.R2_FREE_TIER_BYTES);
  return Number.isFinite(raw) && raw > 0 ? raw : 10 * 1024 ** 3;
}

/**
 * Teto rígido de armazenamento aplicado pelo próprio app (a Cloudflare não
 * oferece limite rígido para o R2, só alertas por email). Novos envios que
 * ultrapassem este valor são recusados. Padrão: 9 GB, abaixo dos 10 GB grátis.
 */
export function storageHardLimitBytes(): number {
  const raw = Number(process.env.R2_STORAGE_HARD_LIMIT_BYTES);
  return Number.isFinite(raw) && raw > 0 ? raw : 9 * 1024 ** 3;
}
