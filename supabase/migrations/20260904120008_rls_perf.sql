-- Corrections de performance signalées par les advisors Supabase :
-- 1) index de couverture sur les clés étrangères non indexées ;
-- 2) `auth.uid()` wrappé en `(select auth.uid())` dans les policies pour
--    qu'il soit évalué une fois par requête (initplan) et non par ligne.

create index announcements_auteur_id_idx on public.announcements (auteur_id);
create index document_folders_created_by_idx on public.document_folders (created_by);
create index document_folders_parent_id_idx on public.document_folders (parent_id);
create index documents_uploaded_by_idx on public.documents (uploaded_by);
create index events_created_by_idx on public.events (created_by);
create index events_organisateur_id_idx on public.events (organisateur_id);

drop policy "profiles_update" on public.profiles;
create policy "profiles_update" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) or private.is_admin())
  with check (id = (select auth.uid()) or private.is_admin());

drop policy "profiles_contact_select" on public.profiles_contact;
create policy "profiles_contact_select" on public.profiles_contact
  for select to authenticated
  using (profile_id = (select auth.uid()) or private.can_see_coordonnees());

drop policy "profiles_contact_update" on public.profiles_contact;
create policy "profiles_contact_update" on public.profiles_contact
  for update to authenticated
  using (profile_id = (select auth.uid()) or private.is_admin())
  with check (profile_id = (select auth.uid()) or private.is_admin());

drop policy "events_insert" on public.events;
create policy "events_insert" on public.events
  for insert to authenticated
  with check (private.can_create_content() and created_by = (select auth.uid()));

drop policy "events_update" on public.events;
create policy "events_update" on public.events
  for update to authenticated
  using (
    private.can_manage_content()
    or (private.current_user_role() = 'responsable' and created_by = (select auth.uid()))
  )
  with check (
    private.can_manage_content()
    or (private.current_user_role() = 'responsable' and created_by = (select auth.uid()))
  );

drop policy "announcements_insert" on public.announcements;
create policy "announcements_insert" on public.announcements
  for insert to authenticated
  with check (private.can_manage_content() and auteur_id = (select auth.uid()));

drop policy "document_folders_insert" on public.document_folders;
create policy "document_folders_insert" on public.document_folders
  for insert to authenticated
  with check (private.can_create_content() and created_by = (select auth.uid()));

drop policy "documents_insert" on public.documents;
create policy "documents_insert" on public.documents
  for insert to authenticated
  with check (private.can_create_content() and uploaded_by = (select auth.uid()));

drop policy "documents_update" on public.documents;
create policy "documents_update" on public.documents
  for update to authenticated
  using (
    private.can_manage_content()
    or (private.current_user_role() = 'responsable' and uploaded_by = (select auth.uid()))
  )
  with check (
    private.can_manage_content()
    or (private.current_user_role() = 'responsable' and uploaded_by = (select auth.uid()))
  );

drop policy "audit_log_insert" on public.audit_log;
create policy "audit_log_insert" on public.audit_log
  for insert to authenticated
  with check (user_id = (select auth.uid()));
