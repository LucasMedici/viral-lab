/**
 * Login e logout do MCP do ViralLab.
 *   npm run mcp:login   pede email e senha (oculta) e salva só a sessão
 *   npm run mcp:logout  encerra a sessão do MCP e apaga o arquivo
 */
import readline from "node:readline/promises";
import { isAllowedUser } from "@/lib/auth/owner";
import { mcpClient, SESSION_FILE } from "./session";

function askHidden(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stdin = process.stdin;
    if (!stdin.isTTY) {
      reject(new Error("Rode este comando num terminal interativo."));
      return;
    }
    process.stdout.write(prompt);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    let value = "";
    const cleanup = () => {
      stdin.off("data", onData);
      stdin.setRawMode(false);
      stdin.pause();
      process.stdout.write("\n");
    };
    const onData = (chunk: string) => {
      for (const ch of chunk) {
        if (ch === "\r" || ch === "\n") {
          cleanup();
          resolve(value);
          return;
        }
        if (ch === "\u0003") {
          cleanup();
          reject(new Error("Cancelado."));
          return;
        }
        if (ch === "\u007f" || ch === "\b") value = value.slice(0, -1);
        else if (ch >= " ") value += ch;
      }
    };
    stdin.on("data", onData);
  });
}

async function login() {
  const owner = process.env.OWNER_EMAIL?.trim();
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const typed = (await rl.question(owner ? `Email (${owner}): ` : "Email: ")).trim();
  rl.close();
  const email = typed || owner;
  if (!email) throw new Error("Informe o email.");
  const password = await askHidden("Senha: ");
  if (!password) throw new Error("Informe a senha.");

  const supabase = mcpClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) throw new Error("Email ou senha incorretos.");
  if (!isAllowedUser(data.user)) {
    await supabase.auth.signOut({ scope: "local" });
    throw new Error("Este usuário não tem acesso ao ViralLab (OWNER_EMAIL).");
  }
  console.log(`Pronto. Sessão do MCP salva em ${SESSION_FILE} (só o seu usuário consegue ler).`);
  console.log("Reinicie o Claude Desktop se ele já estava aberto.");
}

async function logout() {
  const supabase = mcpClient();
  // scope "local": encerra só a sessão do MCP; o login no navegador continua.
  await supabase.auth.signOut({ scope: "local" });
  console.log("Sessão do MCP encerrada.");
}

const command = process.argv[2];
(command === "logout" ? logout() : login())
  .then(() => process.exit(0))
  .catch((e: unknown) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  });
