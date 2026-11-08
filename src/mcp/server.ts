/**
 * Servidor MCP do ViralLab (stdio). Iniciado pelo Claude Desktop via scripts/mcp.sh.
 * O stdout pertence ao protocolo: qualquer log vai para o stderr.
 */
import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { registerReadTools } from "./tools/read-tools";
import { registerWriteTools } from "./tools/write-tools";

const instructions = `ViralLab é o calendário de publicação de vídeos curtos do usuário (TikTok, YouTube Shorts, Instagram Reels).
Fluxo recomendado para postar um lote de vídeos:
1. listar_contas para ver as contas, nichos e ids.
2. ver_agenda para achar horários livres em cada conta.
3. listar_arquivos_de_video na pasta onde os vídeos foram salvos.
4. Monte o plano (conta, data/hora, título, legenda, hashtags, arquivo) e mostre ao usuário. Espere o OK antes de criar.
5. criar_videos com o lote aprovado (até 50 por chamada).
6. acompanhar_envios até todos os arquivos terminarem.
Datas e horas são sempre no horário de Brasília, no formato AAAA-MM-DDTHH:mm. Hashtags vão sem "#" e separadas da legenda.`;

serveStdio(() => {
  const server = new McpServer({ name: "virallab", version: "0.1.0" }, { instructions });
  registerReadTools(server);
  registerWriteTools(server);
  return server;
}, {
  onerror: (e) => console.error("[virallab-mcp]", e),
});

console.error("[virallab-mcp] pronto (stdio)");
