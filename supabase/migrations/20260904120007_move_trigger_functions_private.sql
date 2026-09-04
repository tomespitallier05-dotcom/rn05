-- Termine le nettoyage des advisories de sécurité : déplace les deux
-- fonctions trigger restantes vers le schéma private, par cohérence avec
-- 20260904120006_private_schema.sql. Elles étaient déjà protégées contre un
-- appel RPC direct (Postgres refuse d'exécuter une fonction "returns
-- trigger" hors contexte de trigger), ce déplacement supprime simplement le
-- bruit résiduel du linter de sécurité Supabase.

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, statut)
  values (new.id, 'membre', 'actif')
  on conflict (id) do nothing;

  insert into public.profiles_contact (profile_id)
  values (new.id)
  on conflict (profile_id) do nothing;

  return new;
end;
$$;

create or replace function private.protect_profile_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if private.is_admin() then
    return new;
  end if;

  if new.role is distinct from old.role then
    raise exception 'Seul un administrateur peut modifier le rôle.';
  end if;

  if new.statut is distinct from old.statut then
    raise exception 'Seul un administrateur peut modifier le statut du compte.';
  end if;

  return new;
end;
$$;

drop trigger on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

drop trigger protect_profile_privileged_columns on public.profiles;
create trigger protect_profile_privileged_columns
  before update on public.profiles
  for each row execute function private.protect_profile_privileged_columns();

drop function if exists public.handle_new_user();
drop function if exists public.protect_profile_privileged_columns();
