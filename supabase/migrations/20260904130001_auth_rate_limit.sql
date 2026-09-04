-- Limitation à 5 tentatives par identifiant (IP) et par 15 minutes sur les
-- actions d'authentification (connexion, lien magique, réinitialisation).
--
-- Cette fonction est volontairement dans le schéma public (exposée en RPC)
-- car elle doit être appelable AVANT authentification, donc avec la clé
-- anon — contrairement aux fonctions RLS internes du schéma private.
-- Le client Next.js ne l'appelle jamais directement depuis le navigateur :
-- seule une server action, qui calcule l'IP réelle côté serveur
-- (non falsifiable par le client), lui fournit l'identifiant. La table
-- elle-même n'a aucune policy RLS : elle n'est accessible que via cette
-- fonction SECURITY DEFINER.

create table public.auth_rate_limits (
  id uuid primary key default gen_random_uuid(),
  identifiant text not null,
  created_at timestamptz not null default now()
);

create index auth_rate_limits_identifiant_idx on public.auth_rate_limits (identifiant, created_at);

alter table public.auth_rate_limits enable row level security;

create or replace function public.check_and_record_rate_limit(
  p_identifiant text,
  p_limite int default 5,
  p_fenetre_minutes int default 15
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  delete from public.auth_rate_limits
  where identifiant = p_identifiant
    and created_at < now() - make_interval(mins => p_fenetre_minutes);

  select count(*) into v_count
  from public.auth_rate_limits
  where identifiant = p_identifiant
    and created_at >= now() - make_interval(mins => p_fenetre_minutes);

  if v_count >= p_limite then
    return false;
  end if;

  insert into public.auth_rate_limits (identifiant) values (p_identifiant);
  return true;
end;
$$;

revoke all on function public.check_and_record_rate_limit(text, int, int) from public;
grant execute on function public.check_and_record_rate_limit(text, int, int) to anon, authenticated;
