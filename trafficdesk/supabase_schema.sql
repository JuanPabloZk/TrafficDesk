-- ─────────────────────────────────────────────
-- TrafficDesk — Schema completo do banco
-- Cole no SQL Editor do Supabase e clique em Run
-- ─────────────────────────────────────────────

-- 1. CLIENTES
create table if not exists clients (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  name        text not null,
  short       text,
  platforms   text[] default '{}',
  budget      numeric default 0,
  status      text default 'active' check (status in ('active','warning','paused')),
  created_at  timestamptz default now()
);

-- 2. TAREFAS
create table if not exists tasks (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  title       text not null,
  client      text,
  status      text default 'todo' check (status in ('todo','doing','done')),
  priority    text default 'med' check (priority in ('high','med','low')),
  due         text,
  created_at  timestamptz default now()
);

-- 3. CAMPANHAS WHATSAPP
create table if not exists wa_campaigns (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid references auth.users(id) on delete cascade not null,
  name         text not null,
  client       text,
  status       text default 'draft' check (status in ('draft','scheduled','sending','completed')),
  total        int default 0,
  sent         int default 0,
  delivered    int default 0,
  read_count   int default 0,
  replied      int default 0,
  converted    int default 0,
  msg          text,
  scheduled_at text,
  created_at   timestamptz default now()
);

-- 4. ALERTAS
create table if not exists alerts (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  severity    text default 'low' check (severity in ('high','med','low')),
  client      text,
  message     text,
  platform    text check (platform in ('meta','google')),
  resolved    boolean default false,
  created_at  timestamptz default now()
);

-- 5. CONEXÕES (tokens de plataformas)
create table if not exists connections (
  id            uuid default gen_random_uuid() primary key,
  user_id       uuid references auth.users(id) on delete cascade not null,
  platform      text not null check (platform in ('meta','google')),
  access_token  text,
  bm_id         text,
  status        text default 'idle' check (status in ('idle','connected','error')),
  connected_at  timestamptz,
  updated_at    timestamptz default now()
);

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY — cada user vê só os seus dados
-- ─────────────────────────────────────────────

alter table clients      enable row level security;
alter table tasks        enable row level security;
alter table wa_campaigns enable row level security;
alter table alerts       enable row level security;
alter table connections  enable row level security;

-- Policies: usuário só acessa seus próprios registros
create policy "clients: own data"      on clients      for all using (auth.uid() = user_id);
create policy "tasks: own data"        on tasks        for all using (auth.uid() = user_id);
create policy "wa_campaigns: own data" on wa_campaigns for all using (auth.uid() = user_id);
create policy "alerts: own data"       on alerts       for all using (auth.uid() = user_id);
create policy "connections: own data"  on connections  for all using (auth.uid() = user_id);
