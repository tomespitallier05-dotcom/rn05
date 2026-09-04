-- Déplace les fonctions helper RLS dans un schéma "private" non exposé par
-- PostgREST (PostgREST n'expose que le(s) schéma(s) listés dans sa config,
-- "public" par défaut). Les policies RLS restent fonctionnelles : elles
-- s'exécutent côté Postgres et ne dépendent pas de l'exposition REST,
-- seulement des privilèges GRANT/USAGE, accordés ici au rôle authenticated
-- uniquement (pas à anon). Corrige les advisories
-- anon_security_definer_function_executable /
-- authenticated_security_definer_function_executable.

create schema if not exists private;
grant usage on schema private to authenticated;
revoke all on schema private from anon, public;

create or replace function private.current_user_role()
returns public.role_utilisateur
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function private.current_user_statut()
returns public.statut_compte
language sql
security definer
stable
set search_path = public
as $$
  select statut from public.profiles where id = auth.uid();
$$;

create or replace function private.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false);
$$;

create or replace function private.can_manage_content()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select role in ('admin', 'bureau') from public.profiles where id = auth.uid()), false);
$$;

create or replace function private.can_create_content()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select role in ('admin', 'bureau', 'responsable') from public.profiles where id = auth.uid()), false);
$$;

create or replace function private.can_see_coordonnees()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select role in ('admin', 'bureau', 'responsable') from public.profiles where id = auth.uid()), false);
$$;

create or replace function private.role_rank(r public.role_utilisateur)
returns int
language sql
immutable
set search_path = public
as $$
  select case r
    when 'membre' then 1
    when 'responsable' then 2
    when 'bureau' then 3
    when 'admin' then 4
  end;
$$;

revoke execute on function private.current_user_role() from public, anon;
revoke execute on function private.current_user_statut() from public, anon;
revoke execute on function private.is_admin() from public, anon;
revoke execute on function private.can_manage_content() from public, anon;
revoke execute on function private.can_create_content() from public, anon;
revoke execute on function private.can_see_coordonnees() from public, anon;
revoke execute on function private.role_rank(public.role_utilisateur) from public, anon;

grant execute on function private.current_user_role() to authenticated;
grant execute on function private.current_user_statut() to authenticated;
grant execute on function private.is_admin() to authenticated;
grant execute on function private.can_manage_content() to authenticated;
grant execute on function private.can_create_content() to authenticated;
grant execute on function private.can_see_coordonnees() to authenticated;
grant execute on function private.role_rank(public.role_utilisateur) to authenticated;

-- Recrée les policies en pointant vers private.*.

drop policy "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select to authenticated
  using (deleted_at is null or private.is_admin());

drop policy "profiles_update" on public.profiles;
create policy "profiles_update" on public.profiles
  for update to authenticated
  using (id = auth.uid() or private.is_admin())
  with check (id = auth.uid() or private.is_admin());

drop policy "profiles_contact_select" on public.profiles_contact;
create policy "profiles_contact_select" on public.profiles_contact
  for select to authenticated
  using (profile_id = auth.uid() or private.can_see_coordonnees());

drop policy "profiles_contact_update" on public.profiles_contact;
create policy "profiles_contact_update" on public.profiles_contact
  for update to authenticated
  using (profile_id = auth.uid() or private.is_admin())
  with check (profile_id = auth.uid() or private.is_admin());

drop policy "events_select" on public.events;
create policy "events_select" on public.events
  for select to authenticated
  using (
    private.is_admin()
    or (
      deleted_at is null
      and (
        visibilite = 'tous'
        or (visibilite = 'bureau' and private.current_user_role() in ('admin', 'bureau'))
        or (visibilite = 'role' and private.current_user_role() in ('admin', 'bureau', 'responsable'))
      )
    )
  );

drop policy "events_insert" on public.events;
create policy "events_insert" on public.events
  for insert to authenticated
  with check (private.can_create_content() and created_by = auth.uid());

drop policy "events_update" on public.events;
create policy "events_update" on public.events
  for update to authenticated
  using (
    private.can_manage_content()
    or (private.current_user_role() = 'responsable' and created_by = auth.uid())
  )
  with check (
    private.can_manage_content()
    or (private.current_user_role() = 'responsable' and created_by = auth.uid())
  );

drop policy "announcements_insert" on public.announcements;
create policy "announcements_insert" on public.announcements
  for insert to authenticated
  with check (private.can_manage_content() and auteur_id = auth.uid());

drop policy "announcements_update" on public.announcements;
create policy "announcements_update" on public.announcements
  for update to authenticated
  using (private.can_manage_content())
  with check (private.can_manage_content());

drop policy "announcements_delete" on public.announcements;
create policy "announcements_delete" on public.announcements
  for delete to authenticated
  using (private.can_manage_content());

drop policy "document_folders_insert" on public.document_folders;
create policy "document_folders_insert" on public.document_folders
  for insert to authenticated
  with check (private.can_create_content() and created_by = auth.uid());

drop policy "document_folders_update" on public.document_folders;
create policy "document_folders_update" on public.document_folders
  for update to authenticated
  using (private.can_manage_content())
  with check (private.can_manage_content());

drop policy "documents_select" on public.documents;
create policy "documents_select" on public.documents
  for select to authenticated
  using (
    deleted_at is null
    and private.role_rank(private.current_user_role()) >= private.role_rank(role_minimum)
  );

drop policy "documents_insert" on public.documents;
create policy "documents_insert" on public.documents
  for insert to authenticated
  with check (private.can_create_content() and uploaded_by = auth.uid());

drop policy "documents_update" on public.documents;
create policy "documents_update" on public.documents
  for update to authenticated
  using (
    private.can_manage_content()
    or (private.current_user_role() = 'responsable' and uploaded_by = auth.uid())
  )
  with check (
    private.can_manage_content()
    or (private.current_user_role() = 'responsable' and uploaded_by = auth.uid())
  );

drop policy "audit_log_select" on public.audit_log;
create policy "audit_log_select" on public.audit_log
  for select to authenticated
  using (private.is_admin());

-- Trigger functions handle_new_user / protect_profile_privileged_columns
-- restent en public : leur type de retour "trigger" empêche déjà Postgres
-- de les exécuter hors contexte de trigger, donc un appel RPC direct échoue
-- nativement ("trigger functions can only be called as triggers").

drop function if exists public.current_user_role();
drop function if exists public.current_user_statut();
drop function if exists public.is_admin();
drop function if exists public.can_manage_content();
drop function if exists public.can_create_content();
drop function if exists public.can_see_coordonnees();
drop function if exists public.role_rank(public.role_utilisateur);
