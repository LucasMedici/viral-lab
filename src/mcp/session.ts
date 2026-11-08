import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createClient, type SupabaseClient, type SupportedStorage } from "@supabase/supabase-js";
import { isAllowedUser } from "@/lib/auth/owner";
import type { Database } from "@/types/database";

/**
 * Sessão do MCP. Guarda só os tokens da sessão do Supabase (nunca a senha)
 * num arquivo fora do repositório, legível apenas pelo seu usuário (0600).
 * O RLS do banco continua valendo: o MCP age exatamente como você no app.
 */
export const SESSION_FILE =
  process.env.VIRALLAB_MCP_SESSION_FILE || path.join(os.homedir(), ".config", "virallab", "mcp-session.json");

export const LOGIN_HINT =
  "Sessão do ViralLab ausente ou expirada. No terminal do WSL, na pasta do projeto, rode: npm run mcp:login";

function readStore(): Record<string, string> {
  try {
    return JSON.parse(fs.readFileSync(SESSION_FILE, "utf8")) as Record<string, string>;
  } catch {
    return {};
  }
}

function writeStore(store: Record<string, string>) {
  fs.mkdirSync(path.dirname(SESSION_FILE), { recursive: true, mode: 0o700 });
  const tmp = `${SESSION_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(store), { mode: 0o600 });
  fs.renameSync(tmp, SESSION_FILE); // troca atômica: o refresh token nunca fica pela metade
  fs.chmodSync(SESSION_FILE, 0o600);
}

/** Adaptador de storage em arquivo, para o supabase-js salvar o refresh token rotacionado. */
const fileStorage: SupportedStorage = {
  getItem: (key) => readStore()[key] ?? null,
  setItem: (key, value) => writeStore({ ...readStore(), [key]: value }),
  removeItem: (key) => {
    const store = readStore();
    delete store[key];
    if (Object.keys(store).length === 0) fs.rmSync(SESSION_FILE, { force: true });
    else writeStore(store);
  },
};

export type McpClient = SupabaseClient<Database>;

let client: McpClient | undefined;

export function mcpClient(): McpClient {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) {
      throw new Error("NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ausentes no .env.local");
    }
    client = createClient<Database>(url, key, {
      auth: {
        storage: fileStorage,
        storageKey: "virallab-mcp",
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });
  }
  return client;
}

/** Cliente autenticado como o dono do app. Lança erro com a instrução de login quando não há sessão válida. */
export async function requireMcpUser(): Promise<McpClient> {
  const supabase = mcpClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error(LOGIN_HINT);
  if (!isAllowedUser(data.user)) {
    throw new Error("A sessão salva não é do dono do app (OWNER_EMAIL). Rode npm run mcp:login com o email certo.");
  }
  return supabase;
}
