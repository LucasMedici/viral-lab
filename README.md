<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="public/brand/logo-dark.svg">
  <img src="public/brand/logo-light.svg" alt="ViralLab" width="320">
</picture>

**Central de comando para vídeos curtos: contas, calendário e arquivos de TikToks, Shorts e Reels num só lugar.**

[![CI](https://github.com/LucasMedici/viral-lab/actions/workflows/ci.yml/badge.svg)](https://github.com/LucasMedici/viral-lab/actions/workflows/ci.yml)
![Node.js 22+](https://img.shields.io/badge/node-%3E%3D22-5FA04E?logo=node.js&logoColor=white)
![Next.js 16](https://img.shields.io/badge/Next.js-16-000?logo=nextdotjs)
![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Auth-3FCF8E?logo=supabase&logoColor=white)
![Cloudflare R2](https://img.shields.io/badge/Cloudflare-R2-F38020?logo=cloudflare&logoColor=white)

[Funcionalidades](#funcionalidades) • [Começando](#começando) • [Arquitetura](#arquitetura) • [Documentação](#documentação) • [Roadmap](#roadmap)

</div>

ViralLab é um app web pessoal para quem gerencia várias contas de TikTok, YouTube e Instagram. Você cadastra as contas, sobe os vídeos, organiza tudo num calendário de publicação e acompanha cada vídeo do rascunho até o link publicado. Roda inteiro em planos gratuitos (Vercel Hobby, Supabase Free e Cloudflare R2).

> [!NOTE]
> É um app de uso individual: o cadastro público fica desligado e cada registro é protegido por Row Level Security, então só o dono autenticado enxerga os próprios dados.

## Funcionalidades

- **Contas por plataforma**: TikTok, YouTube e Instagram, com nicho, descrição e contagem de vídeos pendentes.
- **Calendário de publicação**: visões mensal e semanal, mais uma lista dos próximos vídeos, sempre no fuso `America/Sao_Paulo`.
- **Ciclo de vida do vídeo**: `gerado` → `aprovado` → `agendado` → `publicado`, com legenda, hashtags, notas e link final.
- **Upload direto para o R2**: o navegador envia o arquivo por URL assinada (até 2 GB por vídeo), sem passar pelo servidor.
- **Storage sob controle**: indicador de uso no topo do app e teto rígido configurável que recusa envios antes de sair do plano gratuito. Depois de publicar, apague o arquivo e mantenha o registro.
- **Tema claro e escuro**: escuro por padrão, com opção "Sistema".

## Começando

### Pré-requisitos

- [Node.js 22+](https://nodejs.org) (versão em `.nvmrc`)
- Um projeto no [Supabase](https://supabase.com) e um bucket privado no [Cloudflare R2](https://developers.cloudflare.com/r2/)

O passo a passo completo para criar Supabase, R2, GitHub e Vercel do zero está em [docs/SETUP.md](docs/SETUP.md) (cerca de 30 a 40 minutos).

### Rodando localmente

```bash
git clone https://github.com/LucasMedici/viral-lab.git
cd viral-lab
npm install
cp .env.example .env.local   # preencha com as chaves do Supabase e do R2
npx supabase link            # liga o CLI ao seu projeto Supabase
npm run db:push              # aplica as migrations
npm run r2:cors              # aplica a política de CORS no bucket
npm run dev
```

Abra http://localhost:3000 e entre com o usuário criado no painel do Supabase.

> [!IMPORTANT]
> O `.env.local` nunca vai para o repositório. Em produção, as mesmas variáveis ficam em **Vercel › Project Settings › Environment Variables**. Todas estão documentadas em [`.env.example`](.env.example).

> [!WARNING]
> O R2 exige cartão cadastrado mesmo no plano gratuito, e cobra o que passar de 10 GB armazenados. Mantenha `R2_STORAGE_HARD_LIMIT_BYTES` abaixo disso (o padrão é 9 GB).

### Scripts

| Script | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento em http://localhost:3000 |
| `npm run lint` | ESLint |
| `npm run typecheck` | Gera os tipos de rota do Next.js e roda `tsc --noEmit` |
| `npm run build` | Build de produção |
| `npm run db:push` | Aplica `supabase/migrations` no projeto remoto |
| `npm run db:types` | Regenera `src/types/database.ts` a partir do banco |
| `npm run r2:cors` | Aplica a política de CORS no bucket R2 (origens em `R2_CORS_ORIGINS`) |

> [!TIP]
> O CI roda `lint`, `typecheck` e `build` em todo pull request para a `main`. Rode os três localmente antes de abrir o PR. O fluxo de branches está em [docs/BRANCHES.md](docs/BRANCHES.md).

## Arquitetura

| Camada | Tecnologia |
| --- | --- |
| Front-end e servidor | Next.js 16 (App Router, Server Actions), React 19, TypeScript, Tailwind CSS v4 |
| Banco e autenticação | Supabase: Postgres com Row Level Security e Auth por email e senha |
| Arquivos | Cloudflare R2, bucket privado, acesso só por URLs assinadas |
| Deploy e CI | Vercel (deploy só da `main`) e GitHub Actions |

```
src/
├─ app/                 rotas: login e grupo protegido "(app)"
├─ components/          UI compartilhada: logo, calendário, ícones, primitivos em ui/
├─ features/accounts/   contas: queries, server actions, formulários
├─ features/videos/     vídeos: upload, detalhe, publicação
├─ lib/storage/         único ponto de acesso ao storage (interface + implementação R2)
├─ lib/supabase/        clientes Supabase (server, browser, proxy de sessão)
├─ lib/dates.ts         datas no fuso America/Sao_Paulo
└─ proxy.ts             renova a sessão e protege as rotas
supabase/migrations/    schema versionado
scripts/r2-cors.ts      configuração de CORS do bucket
```

O app só conversa com o storage pela interface `StorageProvider` (`src/lib/storage/types.ts`). Para trocar o R2 por outro provedor, implemente essa interface e exporte a nova implementação em `src/lib/storage/index.ts`.

### Identidade visual

A fonte da verdade é [docs/BRAND.md](docs/BRAND.md): paleta, tipografia (Space Grotesk e Inter), componentes e regras do logo. Os arquivos de marca ficam em `public/brand/`, e os tokens de cor em `src/app/globals.css`, expostos no Tailwind (`bg-surface`, `text-muted`, `bg-accent`, `bg-status-*` etc.). Não use cores fora dessa paleta.

## Documentação

| Documento | Conteúdo |
| --- | --- |
| [docs/SETUP.md](docs/SETUP.md) | Do zero ao app no ar: Supabase, R2, GitHub e Vercel |
| [docs/BRANCHES.md](docs/BRANCHES.md) | Fluxo de branches, pull requests e proteção da `main` |
| [docs/BRAND.md](docs/BRAND.md) | Guia de marca: logo, cores, tipografia e componentes |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Planejamento da etapa 2 |

## Roadmap

A v1 cobre gestão de contas, calendário e upload manual. A etapa 2 está desenhada para encaixar sem reescrever o que existe:

- [ ] **Geração de vídeo com [Remotion](https://www.remotion.dev)** a partir de um roteiro em JSON, salvando o resultado pelo mesmo módulo de storage.
- [ ] **Publicação automática** via APIs do TikTok, YouTube e Instagram, com conexões OAuth e agendamento por cron.

Detalhes em [docs/ROADMAP.md](docs/ROADMAP.md).
