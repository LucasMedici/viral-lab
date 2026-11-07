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

## Personalização

- **Logo**: troque `src/components/logo.tsx` e os arquivos em `public/` (`icon.svg`, `favicon.ico`, `apple-icon.png`, `logo.svg`).
- **Cores**: todas as cores (marca, status e plataformas) estão em `src/app/globals.css`, em `:root` (tema claro) e `.dark` (tema escuro).
- **Trocar de storage**: implemente `StorageProvider` (`src/lib/storage/types.ts`) e exporte-o em `src/lib/storage/index.ts`.
