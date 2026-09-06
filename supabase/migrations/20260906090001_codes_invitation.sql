-- Création de compte par code d'invitation (inscription toujours fermée côté
-- Supabase Auth : cette table ne remplace pas signUp(), elle porte
-- l'autorisation qu'une action serveur vérifie avant d'appeler
-- auth.admin.createUser()).
--
-- RLS activée SANS AUCUNE policy sur codes_invitation et signup_attempts :
-- ni anon ni authenticated ne peuvent les lire ou les écrire directement via
-- PostgREST, quel que soit le rôle applicatif. Tous les accès passent par
-- les fonctions security definer ci-dessous, qui appliquent elles-mêmes
-- l'autorisation (is_admin() pour la gestion, aucun droit du tout pour la
-- réservation/le quota — seule la clé secrète, donc service_role, qui
-- ignore les GRANT comme les policies, peut les appeler).

create table public.codes_invitation (
  id uuid primary key default gen_random_uuid(),
  libelle text not null,
  code_hash text not null unique,
  role_attribue public.role_utilisateur not null,
  statut_initial public.statut_compte not null default 'actif',
  usages_max int not null default 1,
  usages int not null default 0,
  expire_le timestamptz not null,
  actif boolean not null default true,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  constraint usages_max_positif check (usages_max > 0),
  constraint usages_dans_les_bornes check (usages >= 0 and usages <= usages_max)
);

comment on table public.codes_invitation is
  'Codes d''inscription à usage limité. code_hash seul est stocké (SHA-256 poivré, calculé côté Node) : un code perdu se révoque, il ne se retrouve pas. RLS sans policy, accès uniquement via fonctions security definer.';

alter table public.codes_invitation enable row level security;

-- Quota anti-brute-force sur /creer-un-compte : une ligne par tentative
-- (succès ou échec), jamais par code testé, pour ne pas transformer la
-- table elle-même en oracle sur les codes valides.
create table public.signup_attempts (
  id uuid primary key default gen_random_uuid(),
  ip text not null,
  succes boolean not null,
  created_at timestamptz not null default now()
);

create index signup_attempts_ip_idx on public.signup_attempts (ip, created_at);

alter table public.signup_attempts enable row level security;

-- reserver_code : verrouille la ligne (FOR UPDATE) le temps de vérifier
-- actif / non expiré / usages restants puis d'incrémenter, pour qu'une
-- course entre deux inscriptions simultanées ne consomme jamais deux fois
-- le dernier usage disponible. Renvoie un ensemble vide (pas d'exception)
-- si le code est invalide, expiré, révoqué ou épuisé : l'appelant ne doit
-- pas pouvoir distinguer ces cas (même message d'erreur générique côté UI).
create or replace function public.reserver_code(p_code_hash text)
returns table (
  id uuid,
  role_attribue public.role_utilisateur,
  statut_initial public.statut_compte
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code public.codes_invitation%rowtype;
begin
  select *
  into v_code
  from public.codes_invitation ci
  where ci.code_hash = p_code_hash
  for update;

  if not found then
    return;
  end if;

  if not v_code.actif or v_code.expire_le < now() or v_code.usages >= v_code.usages_max then
    return;
  end if;

  update public.codes_invitation
  set usages = usages + 1
  where codes_invitation.id = v_code.id;

  return query select v_code.id, v_code.role_attribue, v_code.statut_initial;
end;
$$;

-- liberer_code : rend l'usage consommé par reserver_code si la création du
-- compte échoue ensuite (email déjà utilisé côté Auth, erreur Supabase...).
create or replace function public.liberer_code(p_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.codes_invitation
  set usages = greatest(usages - 1, 0)
  where id = p_id;
$$;

-- quota_creation_depasse : vrai au-delà de 10 échecs pour une même IP sur
-- les 15 dernières minutes (la 11e tentative consécutive est bloquée).
create or replace function public.quota_creation_depasse(p_ip text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select count(*) >= 10
  from public.signup_attempts
  where ip = p_ip
    and succes = false
    and created_at >= now() - interval '15 minutes';
$$;

-- journaliser_tentative : purge au passage les entrées de plus d'un jour
-- pour que la table reste bornée (même logique que
-- check_and_record_rate_limit, cf. 20260904130001_auth_rate_limit.sql).
create or replace function public.journaliser_tentative(p_ip text, p_succes boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.signup_attempts where created_at < now() - interval '1 day';
  insert into public.signup_attempts (ip, succes) values (p_ip, p_succes);
end;
$$;

revoke all on function public.reserver_code(text) from public, anon, authenticated;
revoke all on function public.liberer_code(uuid) from public, anon, authenticated;
revoke all on function public.quota_creation_depasse(text) from public, anon, authenticated;
revoke all on function public.journaliser_tentative(text, boolean) from public, anon, authenticated;

-- admin_creer_code / admin_liste_codes / admin_revoquer_code : à la
-- différence des fonctions ci-dessus, celles-ci sont appelées par l'écran
-- /codes avec le client authentifié normal (pas besoin de clé secrète,
-- contrairement à l'invitation de compte qui appelle l'API Auth Admin) —
-- l'autorisation est donc vérifiée à l'intérieur de la fonction.

create or replace function public.admin_creer_code(
  p_libelle text,
  p_code_hash text,
  p_role_attribue public.role_utilisateur,
  p_statut_initial public.statut_compte,
  p_usages_max int,
  p_expire_le timestamptz
)
returns table (
  id uuid,
  libelle text,
  role_attribue public.role_utilisateur,
  statut_initial public.statut_compte,
  usages_max int,
  expire_le timestamptz,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not private.is_admin() then
    raise exception 'Réservé aux administrateurs.';
  end if;

  insert into public.codes_invitation
    (libelle, code_hash, role_attribue, statut_initial, usages_max, expire_le, created_by)
  values
    (p_libelle, p_code_hash, p_role_attribue, p_statut_initial, p_usages_max, p_expire_le, auth.uid())
  returning codes_invitation.id into v_id;

  insert into public.audit_log (user_id, action, table_cible, id_cible)
  values (auth.uid(), 'creation_code', 'codes_invitation', v_id);

  return query
  select ci.id, ci.libelle, ci.role_attribue, ci.statut_initial, ci.usages_max, ci.expire_le, ci.created_at
  from public.codes_invitation ci
  where ci.id = v_id;
end;
$$;

create or replace function public.admin_liste_codes()
returns table (
  id uuid,
  libelle text,
  role_attribue public.role_utilisateur,
  statut_initial public.statut_compte,
  usages int,
  usages_max int,
  expire_le timestamptz,
  actif boolean,
  created_at timestamptz
)
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if not private.is_admin() then
    raise exception 'Réservé aux administrateurs.';
  end if;

  return query
  select ci.id, ci.libelle, ci.role_attribue, ci.statut_initial, ci.usages, ci.usages_max, ci.expire_le, ci.actif, ci.created_at
  from public.codes_invitation ci
  order by ci.created_at desc;
end;
$$;

-- admin_liste_codes ne renvoie jamais code_hash (cf. colonnes ci-dessus) :
-- un code perdu se révoque, il ne se retrouve pas.

create or replace function public.admin_revoquer_code(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not private.is_admin() then
    raise exception 'Réservé aux administrateurs.';
  end if;

  update public.codes_invitation set actif = false where id = p_id;

  insert into public.audit_log (user_id, action, table_cible, id_cible)
  values (auth.uid(), 'revocation_code', 'codes_invitation', p_id);
end;
$$;

revoke all on function public.admin_creer_code(text, text, public.role_utilisateur, public.statut_compte, int, timestamptz) from public, anon;
revoke all on function public.admin_liste_codes() from public, anon;
revoke all on function public.admin_revoquer_code(uuid) from public, anon;

grant execute on function public.admin_creer_code(text, text, public.role_utilisateur, public.statut_compte, int, timestamptz) to authenticated;
grant execute on function public.admin_liste_codes() to authenticated;
grant execute on function public.admin_revoquer_code(uuid) to authenticated;
