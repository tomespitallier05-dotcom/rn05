-- Trigger : crée la ligne profiles à l'inscription (invitation admin ou
-- première connexion via magic link/mot de passe). SECURITY DEFINER pour
-- pouvoir insérer dans public.profiles malgré RLS.
create or replace function public.handle_new_user()
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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Trigger : un utilisateur non-admin ne peut pas modifier son propre rôle,
-- statut, ou état d'onboarding_complete via une simple requête update sur sa
-- ligne (la policy RLS autorise l'update de sa ligne pour les champs de
-- profil ; ce trigger verrouille les colonnes sensibles en plus).
create or replace function public.protect_profile_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin() then
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

create trigger protect_profile_privileged_columns
  before update on public.profiles
  for each row execute function public.protect_profile_privileged_columns();
