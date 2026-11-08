<div align="center">
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="public/brand/logo-dark.svg">
  <img src="public/brand/logo-light.svg" alt="ViralLab" width="280">
</picture>
</div>

<br>

ViralLab organiza a operação de quem produz vídeos curtos em escala: várias contas de TikTok, YouTube e Instagram, um calendário único de publicação e os arquivos de vídeo no mesmo lugar.

## O que ele faz

- Reúne as contas de TikTok, YouTube e Instagram numa tela, com o nicho e os vídeos pendentes de cada uma
- Mostra num calendário mensal ou semanal tudo o que vai ao ar, em todas as contas
- Leva cada vídeo por um fluxo simples: gerado, aprovado, agendado e publicado
- Envia o vídeo direto do navegador para o armazenamento, até 2 GB por arquivo
- Guarda legenda, hashtags, notas e o link publicado junto com o vídeo
- Controla o espaço usado para o custo de armazenamento não fugir do previsto

## Tecnologia

Next.js 16, React 19, TypeScript e Tailwind CSS v4, com Supabase (Postgres e autenticação), Cloudflare R2 para os vídeos e deploy na Vercel.

## MCP no Claude Desktop

O ViralLab tem um servidor MCP local. Com ele, o Claude Desktop cria os vídeos no calendário (título, legenda, hashtags, conta e horário) e envia os arquivos que estão no seu PC, tudo a partir da conversa.

1. No terminal, na pasta do projeto, entre uma vez com o seu usuário. Só a sessão fica salva, em `~/.config/virallab/`, nunca a senha.

   ```bash
   npm run mcp:login
   ```

2. No Claude Desktop, abra **Configurações › Desenvolvedor › Editar configuração**, adicione o servidor e reinicie o app. No Windows com o projeto dentro do WSL:

   ```json
   {
     "mcpServers": {
       "virallab": {
         "command": "wsl.exe",
         "args": ["-d", "Ubuntu", "--cd", "/caminho/para/viral-lab", "--", "bash", "scripts/mcp.sh"]
       }
     }
   }
   ```

   No macOS ou no Linux, use `"command": "bash"` e `"args": ["/caminho/para/viral-lab/scripts/mcp.sh"]`.

3. Na conversa, peça algo como: "Posta os vídeos da pasta C:\Users\voce\Videos\lote no ViralLab, dois por dia em cada conta, às 12h e às 19h". O Claude mostra o plano, espera o seu OK e cria os cards. Os arquivos sobem em segundo plano.

Ferramentas: `listar_contas`, `ver_agenda`, `listar_arquivos_de_video`, `criar_videos`, `atualizar_video` e `acompanhar_envios`. O servidor usa a sua sessão com Row Level Security e não abre nenhuma porta na rede. Para sair, rode `npm run mcp:logout`.

## Desenvolvimento

Requer Node 22+. As variáveis de ambiente estão descritas em [`.env.example`](.env.example).

```bash
npm install
cp .env.example .env.local
npm run dev
```

Antes de abrir um pull request, rode `npm run lint`, `npm run typecheck` e `npm run build`, os mesmos passos do CI.
