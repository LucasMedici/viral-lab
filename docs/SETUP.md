# Setup manual — do zero ao app no ar

Siga na ordem. Tempo estimado: 30–40 minutos. Tudo em planos gratuitos; os pontos que **podem gerar cobrança** estão marcados com ⚠️.

Vá anotando os valores num bloco de notas temporário. Eles vão para dois lugares: o arquivo `.env.local` (para rodar no seu computador) e a Vercel (produção).

| Variável | Onde pegar |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase, passo 1.3 |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase, passo 1.3 |
| `R2_ACCOUNT_ID` | Cloudflare, passo 2.4 |
| `R2_ACCESS_KEY_ID` | Cloudflare, passo 2.4 |
| `R2_SECRET_ACCESS_KEY` | Cloudflare, passo 2.4 |
| `R2_BUCKET` | `viral-lab` |
| `R2_FREE_TIER_BYTES` | `10737418240` (10 GB) |
| `R2_STORAGE_HARD_LIMIT_BYTES` | `9663676416` (9 GB, teto do app; opcional) |
| `NEXT_PUBLIC_APP_TIMEZONE` | `America/Sao_Paulo` |
| `R2_CORS_ORIGINS` | só local: `http://localhost:3000,https://virallab.vercel.app` |

---

## 0. Pré-requisito local

- Node.js 22 ou mais novo. Com nvm: `nvm install 22 && nvm use` (o projeto tem `.nvmrc`).
- Na pasta do projeto: `npm install`.

## 1. Supabase (banco + login)

1. Acesse <https://supabase.com/dashboard>, entre com o GitHub e clique em **New project**.
   - **Name**: `viral-lab`
   - **Database password**: gere uma senha forte e **guarde** (usada no passo 1.6).
   - **Region**: `South America (São Paulo)`.
   - Plano **Free**. Clique em **Create new project** e espere ~2 min.
2. **Desligar o cadastro público**: menu **Authentication › Sign In / Providers**. Em **User Signups**, desligue **Allow new users to sign up** e salve. Mantenha o provedor **Email** habilitado.
   - Em **Authentication › Sign In / Providers › Email**, pode desligar **Confirm email** (você criará o usuário já confirmado).
3. **Chaves**: menu **Project Settings › API Keys**.
   - Copie a **Publishable key** (`sb_publishable_…`) → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
     (Se o projeto só mostrar chaves "legacy", use a **anon public**.)
   - Em **Project Settings › Data API** copie a **Project URL** (`https://xxxx.supabase.co`) → `NEXT_PUBLIC_SUPABASE_URL`.
   - **Não** use a `secret`/`service_role` key: o app não precisa dela.
4. **Criar o seu usuário**: menu **Authentication › Users › Add user › Create new user**. Informe seu email e uma senha, marque **Auto Confirm User** e crie. É com esse email/senha que você entra no ViralLab.
5. Anote o **Project ref**: é o trecho `xxxx` da URL `https://xxxx.supabase.co` (também aparece em **Project Settings › General**).
6. **Criar as tabelas** (aplica `supabase/migrations`). No terminal, na pasta do projeto:

   ```bash
   npx supabase login                       # abre o navegador para autorizar a CLI
   npx supabase link --project-ref SEU_REF  # pede a senha do banco do passo 1.1
   npm run db:push                          # cria tabelas, view e políticas de RLS
   ```

   Alternativa sem CLI: abra **SQL Editor › New query**, cole o conteúdo de `supabase/migrations/20261107000000_init.sql` e clique em **Run**.
7. Confira em **Table Editor** que existem `accounts` e `videos`, ambas com o selo **RLS enabled**.

> Plano Free: 500 MB de banco e até 2 projetos ativos. **Projetos sem atividade por 7 dias são pausados**; basta clicar em **Restore** no painel (sem custo). Usando o app toda semana, isso não acontece.

## 2. Cloudflare R2 (arquivos de vídeo)

1. Crie uma conta em <https://dash.cloudflare.com> (ou entre na sua).
2. No menu lateral, **R2 Object Storage** → **Purchase R2 / Get started**. ⚠️ A Cloudflare **exige cartão de crédito ou PayPal** para ativar o R2, mesmo no plano gratuito.
   - Grátis por mês: **10 GB armazenados**, 1 milhão de operações Classe A (escrita/listagem) e 10 milhões Classe B (leitura). **Download (egress) é grátis.**
   - ⚠️ Passou disso, cobra (cerca de US$ 0,015 por GB-mês adicional). O indicador no topo do app e o hábito de apagar o arquivo após publicar mantêm você dentro do limite.
3. **Create bucket**:
   - **Bucket name**: `viral-lab`
   - **Location**: Automatic. **Default storage class**: Standard.
   - Deixe o bucket **privado** (não ative "Public access" nem "r2.dev subdomain").
4. **Chaves de API**: na página do R2, clique em **API › Manage API tokens › Create Account API token** (ou **Create User API token**).
   - **Token name**: `virallab`
   - **Permissions**: **Object Read & Write**
   - **Specify bucket(s)**: **Apply to specific buckets only** → `viral-lab`
   - **TTL**: Forever. Clique em **Create API Token**.
   - Na tela seguinte (mostrada **uma única vez**) copie:
     - **Access Key ID** → `R2_ACCESS_KEY_ID`
     - **Secret Access Key** → `R2_SECRET_ACCESS_KEY`
   - O **Account ID** aparece na página inicial do R2 (lado direito, "Account details") e na URL do painel → `R2_ACCOUNT_ID`.
5. **CORS** (permite o navegador enviar e tocar os vídeos): abra o bucket › **Settings › CORS Policy › Add CORS policy** e cole (troque o domínio da Vercel depois do passo 4.4, se for diferente):

   ```json
   [
     {
       "AllowedOrigins": ["http://localhost:3000", "https://virallab.vercel.app"],
       "AllowedMethods": ["GET", "PUT", "HEAD"],
       "AllowedHeaders": ["content-type"],
       "ExposeHeaders": ["ETag"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```

   Alternativa: `npm run r2:cors` aplica a mesma política via API usando o `.env.local` (exige um token com permissão **Admin Read & Write**; com o token "Object Read & Write" ele só imprime o JSON para você colar).
6. **Alertas por email (recomendado).** A Cloudflare **não tem limite rígido** para o R2, só alertas, que avisam mas não bloqueiam o uso:
   - **Manage Account › Billing › Billable Usage › Create budget alert**: crie um alerta de **US$ 0,01** (avisa na primeira cobrança) e outro de **US$ 1**. Disponível para contas Pay-as-you-go, ou seja, depois de ativar o R2. Os dados de uso atualizam uma vez por dia.
   - Opcional: em **Notifications › Add**, veja se há alerta de uso específico do R2 (por armazenamento ou operações).
7. **Teto no próprio app.** Além dos alertas, o ViralLab recusa envios que passariam de `R2_STORAGE_HARD_LIMIT_BYTES` (padrão 9 GB, abaixo dos 10 GB grátis). Isso funciona como limite rígido porque só o app tem o token de escrita no bucket.

## 3. Rodar localmente

```bash
cp .env.example .env.local   # preencha com os valores anotados
npm run dev                  # http://localhost:3000
```

Entre com o usuário do passo 1.4, cadastre uma conta e envie um vídeo de teste.

## 4. GitHub e Vercel

### 4.1 Repositório

1. Em <https://github.com/new>: **Repository name** `virallab`, **Public**, **sem** README/.gitignore/licença (o repositório precisa nascer vazio). **Create repository**.
2. No terminal, na pasta do projeto:

   ```bash
   git remote add origin https://github.com/SEU_USUARIO/virallab.git
   git push -u origin main
   ```

   (Ou, com a GitHub CLI logada: `gh repo create virallab --public --source . --push`.)

### 4.2 Projeto na Vercel

1. Em <https://vercel.com/new>, entre com o GitHub (plano **Hobby**), clique em **Import** no repositório `virallab`.
   - Se o repositório não aparecer: **Adjust GitHub App Permissions** e libere o acesso a ele.
2. **Project Name**: `virallab`. **Framework Preset**: Next.js (detectado). Não mexa em Build/Output.
3. Abra **Environment Variables** e adicione, uma por uma (ambiente **Production**):
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_FREE_TIER_BYTES`, `NEXT_PUBLIC_APP_TIMEZONE`.
   (Dica: dá para colar o conteúdo do `.env.local` inteiro no primeiro campo; a Vercel separa as variáveis.)
4. **Deploy**. Ao terminar, copie o domínio de produção (ex.: `virallab.vercel.app`, ou `virallab-xxxx.vercel.app` se o nome estiver ocupado).
5. Se o domínio for diferente de `virallab.vercel.app`, atualize o CORS do R2 (passo 2.5).
6. Se mudar alguma variável depois, faça **Deployments › … › Redeploy** para valer.

### 4.3 Só a `main` gera deploy

O `vercel.json` já desliga os deploys de outras branches:

```json
{ "git": { "deploymentEnabled": { "**": false, "main": true } } }
```

Confira no primeiro PR: a aba **Deployments** da Vercel não deve ganhar um "Preview". Se ganhar, use o plano B em **Project Settings › Git › Ignored Build Step**, opção **Custom**, com o comando:

```bash
[ "$VERCEL_GIT_COMMIT_REF" != "main" ]
```

(retorna 0 = pula o build em qualquer branch que não seja a `main`).

> Vercel Hobby é gratuito para uso **pessoal e não comercial**. Os vídeos não passam pela Vercel (vão direto ao R2), então os limites de banda e de funções ficam muito folgados.

### 4.4 Proteção da `main`

Veja [BRANCHES.md](BRANCHES.md#configurar-a-proteção-da-main-no-github). Faça depois do primeiro PR, quando o check `ci` já tiver rodado uma vez.

## 5. Conferência final

- [ ] `https://SEU_DOMINIO/` redireciona para `/login`; não existe opção de cadastro.
- [ ] Login com seu usuário funciona.
- [ ] Upload de um vídeo mostra a barra de progresso (na aba Network do navegador, o `PUT` vai para `*.r2.cloudflarestorage.com`, não para a Vercel).
- [ ] O preview toca na tela do vídeo e o botão "Baixar arquivo" funciona.
- [ ] Colar o link do post marca como publicado e pergunta se quer apagar o arquivo.
- [ ] O indicador de armazenamento no topo diminui ao apagar.

### Problemas comuns

| Sintoma | Causa provável |
| --- | --- |
| Upload falha com "Falha de rede ou CORS" | CORS do bucket sem a origem atual (confira `http://localhost:3000` / domínio da Vercel, sem barra no final). |
| "Não foi possível preparar o envio" | Variáveis `R2_*` ausentes ou erradas (na Vercel, lembre do Redeploy). |
| Login diz "Email ou senha incorretos" com a senha certa | Usuário criado sem **Auto Confirm**; confirme em Authentication › Users. |
| Listas vazias mesmo com dados | Migration não aplicada ou dados inseridos por outro usuário (RLS filtra por dono). |
