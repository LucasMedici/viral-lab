# Roadmap — etapa 2

A v1 cobre gestão de contas, calendário e upload manual. Abaixo, onde cada peça da etapa 2 se encaixa sem reescrever o que existe.

## Geração de vídeo a partir de roteiro JSON (Remotion)

- **Banco**: nova tabela `video_scripts` (`id`, `account_id`, `script jsonb`, `created_at`) e `render_jobs` (`id`, `script_id`, `status`, `error`, `video_id`, timestamps).
- **Vídeo gerado**: ao terminar a renderização, o worker envia o MP4 pelo mesmo módulo `src/lib/storage` e cria a linha em `videos` com `source = 'gerado'` e `status = 'gerado'`. As telas atuais (calendário, detalhe, publicação, apagar arquivo) funcionam sem mudança.
- **Código**: `remotion/` na raiz (composições), `src/features/scripts/` (editor/validador do JSON com zod).
- **Onde renderizar**: renderização de vídeo não cabe na Vercel Hobby (limites de tempo e memória das funções). Opções: rodar localmente (`npx remotion render`, custo zero), um worker num serviço com plano gratuito, ou Remotion Lambda (gera cobrança na AWS). Licença do Remotion é gratuita para pessoa física.

## Publicação automática via API

- **Conexões**: tabela `platform_connections` (`account_id`, `access_token` criptografado, `refresh_token`, `expires_at`, `scopes`) e uma tela "Conexões" para autorizar cada conta via OAuth.
- **Código**: `src/lib/publishers/` com uma interface comum:

  ```ts
  interface Publisher {
    publish(video: Video, fileUrl: string): Promise<{ url: string }>;
  }
  ```

  e implementações `tiktok.ts` (Content Posting API), `youtube.ts` (YouTube Data API v3) e `instagram.ts` (Instagram Graph API, exige conta Business/Creator ligada a uma Página do Facebook).
- **Agendamento**: um cron (Vercel Cron no Hobby roda no máximo 1×/dia; para horários exatos, Supabase `pg_cron` + Edge Function) busca vídeos `agendado` com `scheduled_at <= now()`, publica, grava `published_url` e marca `publicado`.
- **Atenção**: as APIs das plataformas exigem revisão/aprovação do app e têm cotas. TikTok exige auditoria para postar publicamente.
