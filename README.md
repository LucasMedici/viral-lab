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

## Desenvolvimento

Requer Node 22+. As variáveis de ambiente estão descritas em [`.env.example`](.env.example).

```bash
npm install
cp .env.example .env.local
npm run dev
```

Antes de abrir um pull request, rode `npm run lint`, `npm run typecheck` e `npm run build`, os mesmos passos do CI.
