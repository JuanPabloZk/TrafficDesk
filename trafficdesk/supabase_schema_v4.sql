-- ════════════════════════════════════════════════════════════
-- FIX v4: Adicionar constraints únicos faltantes para upsert
-- ════════════════════════════════════════════════════════════

-- 1. Tabela CONNECTIONS — constraint para (user_id, platform)
-- Remove duplicatas se existirem
delete from connections a using connections b
where a.id < b.id and a.user_id = b.user_id and a.platform = b.platform;

-- Adiciona constraint único
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'connections_user_platform_unique'
  ) then
    alter table connections add constraint connections_user_platform_unique unique (user_id, platform);
  end if;
end$$;

-- 2. Tabela CLIENTS — constraint para (user_id, account_id, platform)
-- Remove duplicatas
delete from clients a using clients b
where a.id < b.id 
  and a.user_id = b.user_id 
  and a.account_id = b.account_id 
  and a.platform = b.platform
  and a.account_id is not null;

-- Cria índice único parcial (só aplica quando account_id não é null)
drop index if exists clients_user_account_platform_idx;
create unique index clients_user_account_platform_idx
  on clients(user_id, account_id, platform) 
  where account_id is not null;

-- Verificação
select 'connections' as tabela, conname as constraint_name 
from pg_constraint 
where conname = 'connections_user_platform_unique'
union all
select 'clients' as tabela, indexname as constraint_name
from pg_indexes 
where indexname = 'clients_user_account_platform_idx';
