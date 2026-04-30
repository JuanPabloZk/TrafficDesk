-- ════════════════════════════════════════════════════════════
-- FIX v5: Substituir índice parcial por constraint válido em clients
-- ════════════════════════════════════════════════════════════

-- 1. Remove o índice parcial (não funciona para ON CONFLICT)
drop index if exists clients_user_account_platform_idx;

-- 2. Garante que account_id não é null (necessário para o constraint)
update clients set account_id = id::text where account_id is null;
alter table clients alter column account_id set not null;

-- 3. Cria constraint único de verdade
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'clients_user_account_platform_unique'
  ) then
    alter table clients add constraint clients_user_account_platform_unique 
      unique (user_id, account_id, platform);
  end if;
end$$;

-- 4. Verificação
select conname as constraint_name, contype as tipo
from pg_constraint
where conrelid = 'clients'::regclass
  and conname like '%user_account%';
