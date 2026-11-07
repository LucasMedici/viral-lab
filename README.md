# ViralLab

App web pessoal para gerenciar contas de TikTok, YouTube e Instagram e o calendário de publicação de vídeos curtos (TikToks, Shorts e Reels).

- **Next.js** (App Router) + TypeScript + Tailwind CSS v4
- **Supabase**: Postgres com Row Level Security + Auth (email e senha, cadastro público desligado)
- **Cloudflare R2**: arquivos de vídeo em bucket privado, com upload direto do navegador via URLs assinadas
- **Vercel** (Hobby) para produção, **GitHub Actions** para CI

## Começando

```bash
npm install
cp .env.example .env.local   # preencha (veja docs/SETUP.md)
npm run dev
```

| Script | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento em http://localhost:3000 |
| `npm run lint` / `npm run typecheck` / `npm run build` | O mesmo que o CI roda |
| `npm run db:push` | Aplica `supabase/migrations` no projeto ligado (`npx supabase link`) |
| `npm run db:types` | Regenera `src/types/database.ts` a partir do banco |
| `npm run r2:cors` | Aplica a política de CORS no bucket R2 |

## Documentação

- [docs/SETUP.md](docs/SETUP.md): passo a passo para criar Supabase, R2, GitHub e Vercel
- [docs/BRANCHES.md](docs/BRANCHES.md): fluxo de branches, PRs e proteção da `main`
- [docs/ROADMAP.md](docs/ROADMAP.md): etapa 2 (geração com Remotion e publicação automática)

## Estrutura

```
src/
├─ app/                 rotas (login e grupo protegido "(app)")
├─ components/          UI compartilhada: logo, calendário, ícones, primitivos em ui/
├─ features/accounts/   contas: queries, server actions, formulários
├─ features/videos/     vídeos: upload, detalhe, publicação
├─ lib/storage/         ÚNICO acesso ao storage (interface + implementação R2)
├─ lib/supabase/        clientes Supabase (server, browser, proxy de sessão)
├─ lib/dates.ts         fuso America/Sao_Paulo
└─ proxy.ts             renova a sessão e protege as rotas
supabase/migrations/    schema versionado
```

## Identidade visual

A fonte da verdade é [docs/BRAND.md](docs/BRAND.md): paleta, tipografia (Space Grotesk + Inter), componentes e regras do logo.

- **Logo**: arquivos em `public/brand/`; o componente `src/components/logo.tsx` alterna `logo-dark.svg` / `logo-light.svg` conforme o tema.
- **Ícones do app**: `public/favicon.ico`, `public/icon.svg`, `public/apple-touch-icon.png` (configurados em `src/app/layout.tsx`).
- **Cores**: tokens do BRAND.md em `src/app/globals.css` (`:root` = claro, `.dark` = escuro), expostos no Tailwind como `bg-background`, `bg-surface`, `bg-surface-2`, `text-text`, `text-muted`, `bg-accent`, `text-link`, `text-danger` e `bg-status-*`. Não use cores fora dessa paleta.
- **Tema**: escuro por padrão; claro pelo botão no topo ou pela opção "Sistema".
- **Trocar de storage**: implemente `StorageProvider` (`src/lib/storage/types.ts`) e exporte-o em `src/lib/storage/index.ts`.
