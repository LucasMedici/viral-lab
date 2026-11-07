-- ViralLab — schema inicial
-- Contas de redes sociais e vídeos curtos com calendário de publicação.

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------
create type public.platform as enum ('tiktok', 'youtube', 'instagram');
create type public.video_status as enum ('gerado', 'aprovado', 'agendado', 'publicado');
create type public.video_source as enum ('upload', 'gerado');

-- ---------------------------------------------------------------------------
-- accounts
-- ---------------------------------------------------------------------------
create table public.accounts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  platform      public.platform not null,
  username      text not null check (username !~ '^@' and length(username) between 1 and 100),
  display_name  text not null check (length(display_name) between 1 and 120),
  description   text,
  niche         text,
  created_at    timestamptz not null default now(),
  unique (user_id, platform, username)
);

comment on column public.accounts.username is 'Nome de usuário sem o @ (a interface exibe com @).';

-- ---------------------------------------------------------------------------
-- videos
-- ---------------------------------------------------------------------------
create table public.videos (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null default auth.uid() references auth.users (id) on delete cascade,
  account_id       uuid not null references public.accounts (id) on delete restrict,
  title            text not null check (length(title) between 1 and 200),
  caption          text,
  hashtags         text[] not null default '{}',
  file_key         text,
  file_name        text,
  file_size_bytes  bigint check (file_size_bytes is null or file_size_bytes >= 0),
  file_mime        text,
  file_deleted_at  timestamptz,
  status           public.video_status not null default 'gerado',
  scheduled_at     timestamptz,
  published_url    text,
  published_at     timestamptz,
  notes            text,
  source           public.video_source not null default 'upload',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

comment on column public.videos.file_key is 'Chave do objeto no storage (R2). Mantida mesmo após apagar o arquivo.';
comment on column public.videos.file_deleted_at is 'Quando o arquivo foi removido do storage. O registro permanece.';
comment on column public.videos.source is 'Origem do vídeo: upload manual ou geração automática (etapa 2).';

create index videos_account_scheduled_idx on public.videos (account_id, scheduled_at);
create index videos_status_idx on public.videos (status);
create index videos_user_idx on public.videos (user_id);
create index accounts_user_idx on public.accounts (user_id);

-- updated_at automático
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger videos_set_updated_at
  before update on public.videos
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- View: contas com contagem de vídeos pendentes (respeita RLS do chamador)
-- ---------------------------------------------------------------------------
create view public.account_overview
with (security_invoker = true)
as
select
  a.*,
  count(v.id) filter (where v.status <> 'publicado')::int as pending_count,
  count(v.id)::int as video_count
from public.accounts a
left join public.videos v on v.account_id = a.id
group by a.id;

-- ---------------------------------------------------------------------------
-- Row Level Security: apenas o dono autenticado acessa seus registros
-- ---------------------------------------------------------------------------
alter table public.accounts enable row level security;
alter table public.videos enable row level security;

create policy "accounts: dono lê" on public.accounts
  for select to authenticated using (user_id = (select auth.uid()));
create policy "accounts: dono cria" on public.accounts
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "accounts: dono altera" on public.accounts
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "accounts: dono apaga" on public.accounts
  for delete to authenticated using (user_id = (select auth.uid()));

create policy "videos: dono lê" on public.videos
  for select to authenticated using (user_id = (select auth.uid()));
create policy "videos: dono cria" on public.videos
  for insert to authenticated with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.accounts a where a.id = account_id and a.user_id = (select auth.uid()))
  );
create policy "videos: dono altera" on public.videos
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "videos: dono apaga" on public.videos
  for delete to authenticated using (user_id = (select auth.uid()));

-- Usuários anônimos não têm acesso algum
revoke all on public.accounts, public.videos, public.account_overview from anon;
