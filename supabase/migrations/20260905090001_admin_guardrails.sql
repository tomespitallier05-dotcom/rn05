-- Garde-fous 5 (administration) appliqués au niveau trigger, pas seulement
-- dans la server action : un admin authentifié pourrait sinon contourner
-- l'écran et appeler l'API REST directement avec sa propre session (la
-- policy RLS profiles_update autorise déjà id = auth.uid() OR is_admin(),
-- donc rien ne l'empêcherait autrement).
--
-- 1. Un admin ne peut pas modifier son propre rôle ni son propre statut.
-- 2. Aucune opération ne doit pouvoir laisser la fédération sans
--    administrateur actif.
create or replace function private.protect_profile_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_autres_admins_actifs int;
begin
  if not private.is_admin() then
    if new.role is distinct from old.role then
      raise exception 'Seul un administrateur peut modifier le rôle.';
    end if;
    if new.statut is distinct from old.statut then
      raise exception 'Seul un administrateur peut modifier le statut du compte.';
    end if;
    return new;
  end if;

  if old.id = (select auth.uid())
     and (new.role is distinct from old.role or new.statut is distinct from old.statut) then
    raise exception 'Un administrateur ne peut pas modifier son propre rôle ou statut.';
  end if;

  if old.role = 'admin' and old.statut = 'actif'
     and (new.role is distinct from 'admin'::public.role_utilisateur
          or new.statut is distinct from 'actif'::public.statut_compte) then
    select count(*) into v_autres_admins_actifs
    from public.profiles
    where role = 'admin' and statut = 'actif' and deleted_at is null and id <> old.id;

    if v_autres_admins_actifs = 0 then
      raise exception 'Impossible : cela laisserait la fédération sans administrateur actif.';
    end if;
  end if;

  return new;
end;
$$;

-- Même garde côté suppression : la suppression RGPD d'un compte passe par
-- l'API Auth Admin (clé secrète, contourne RLS) puis cascade en DELETE sur
-- profiles — un trigger BEFORE DELETE reste le seul filet de sécurité pour
-- ce chemin, y compris contre un bug futur dans la server action elle-même.
create or replace function private.protect_last_active_admin_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_autres_admins_actifs int;
begin
  if old.role = 'admin' and old.statut = 'actif' then
    select count(*) into v_autres_admins_actifs
    from public.profiles
    where role = 'admin' and statut = 'actif' and deleted_at is null and id <> old.id;

    if v_autres_admins_actifs = 0 then
      raise exception 'Impossible : cela laisserait la fédération sans administrateur actif.';
    end if;
  end if;

  return old;
end;
$$;

drop trigger if exists protect_last_active_admin_delete on public.profiles;
create trigger protect_last_active_admin_delete
  before delete on public.profiles
  for each row execute function private.protect_last_active_admin_delete();
