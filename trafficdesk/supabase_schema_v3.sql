-- ════════════════════════════════════════════════════════
-- MIGRAÇÃO v3: Salvar contas conectadas via API
-- ════════════════════════════════════════════════════════

-- Adicionar campos para salvar contas vindas da Meta/Google API
alter table clients add column if not exists account_id text;
alter table clients add column if not exists platform text default 'meta';
alter table clients add column if not exists currency text default 'BRL';
alter table clients add column if not exists notes text;
alter table clients add column if not exists tags text[] default '{}';
alter table clients add column if not exists last_synced_at timestamptz;
alter table clients add column if not exists is_archived boolean default false;

-- Índice único: cada conta de plataforma só pode ser salva uma vez por usuário
create unique index if not exists clients_user_account_platform_idx
  on clients(user_id, account_id, platform)
  where account_id is not null;

-- Índice para busca rápida
create index if not exists clients_user_platform_idx on clients(user_id, platform);

-- RLS já está habilitada da v1, mas garantimos que existe
alter table clients enable row level security;

-- Recriar policy se necessário
drop policy if exists "Users manage own clients" on clients;
create policy "Users manage own clients" on clients for all
  using (auth.uid() = user_id);

-- ════════════════════════════════════════════════════════
-- Pronto! Agora as contas conectadas via API serão salvas
-- automaticamente na tabela clients e persistem entre sessões.
-- ════════════════════════════════════════════════════════
