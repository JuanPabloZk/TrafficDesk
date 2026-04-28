-- ─────────────────────────────────────────────────────────────
-- TrafficDesk — Tabelas adicionais
-- Cole no SQL Editor do Supabase e clique em Run
-- ─────────────────────────────────────────────────────────────

-- 1. CONFIGURAÇÕES POR CLIENTE (orçamento, notas, status customizado)
create table if not exists client_settings (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  account_id  text not null,           -- ID da conta na Meta/Google
  platform    text not null,           -- 'meta' ou 'google'
  name        text,                    -- nome customizado
  budget      numeric default 0,       -- orçamento mensal definido pelo gestor
  notes       text,                    -- anotações internas
  status      text default 'active',   -- active | warning | paused
  updated_at  timestamptz default now(),
  unique(user_id, account_id, platform)
);

-- 2. PREFERÊNCIAS DO USUÁRIO
create table if not exists user_preferences (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users(id) on delete cascade not null unique,
  dash_period text default 'last_30d',  -- período padrão do dashboard
  last_view   text default 'dashboard', -- última aba visitada
  rep_period  text default '30d',       -- período padrão de relatórios
  updated_at  timestamptz default now()
);

-- 3. CACHE DE MÉTRICAS (evita tela vazia enquanto carrega)
create table if not exists metrics_cache (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  account_id  text not null,
  platform    text not null default 'meta',
  period      text not null,
  data        jsonb not null,           -- dados completos da API
  fetched_at  timestamptz default now(),
  unique(user_id, account_id, platform, period)
);

-- 4. RLS para novas tabelas
alter table client_settings  enable row level security;
alter table user_preferences enable row level security;
alter table metrics_cache    enable row level security;

create policy "client_settings: own" on client_settings  for all using (auth.uid() = user_id);
create policy "user_prefs: own"      on user_preferences for all using (auth.uid() = user_id);
create policy "metrics_cache: own"   on metrics_cache    for all using (auth.uid() = user_id);

-- 5. Limpar alertas antigos e preparar para dados reais
-- (a tabela alerts já existe do schema anterior)
-- Garante que a estrutura está correta
alter table alerts add column if not exists auto_generated boolean default false;
alter table alerts add column if not exists metric_value  numeric;
alter table alerts add column if not exists threshold     numeric;

-- 6. REGRAS DE CONTROLE DE VERBA
create table if not exists budget_rules (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  name        text not null,
  account_id  text,                    -- null = todas as contas
  currency    text default 'BRL' check (currency in ('BRL','EUR','USD')),
  limit_value numeric not null,        -- valor máximo definido
  alert_pct   int default 80,          -- % para gerar aviso (ex: 80)
  period      text default 'monthly' check (period in ('monthly','weekly','daily')),
  active      boolean default true,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table budget_rules enable row level security;
create policy "budget_rules: own" on budget_rules for all using (auth.uid() = user_id);
