-- Activation RLS + policies. Applique la matrice de permissions du cahier
-- des charges (admin > bureau > responsable > membre). Deny-by-default :
-- toute opération sans policy correspondante est refusée par Postgres.

alter table public.profiles enable row level security;
alter table public.profiles_contact enable row level security;
alter table public.events enable row level security;
alter table public.announcements enable row level security;
alter table public.document_folders enable row level security;
alter table public.documents enable row level security;
alter table public.audit_log enable row level security;

-- profiles ---------------------------------------------------------------
-- Voir annuaire : tous les rôles authentifiés (nom/commune/fonction/etc.,
-- jamais le téléphone qui vit dans profiles_contact).
create policy "profiles_select" on public.profiles
  for select to authenticated
  using (deleted_at is null or public.is_admin());

-- La ligne est créée par le trigger handle_new_user ; aucun insert client.
-- Update : chacun modifie sa propre fiche (bio, photo, commune...), un
-- admin modifie n'importe quelle fiche (gestion des comptes). Le trigger
-- protect_profile_privileged_columns verrouille role/statut pour les
-- non-admins.
create policy "profiles_update" on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- Pas de policy delete : suppression logique uniquement, via update
-- deleted_at (admin) — la suppression physique reste bloquée par RLS.

-- profiles_contact ---------------------------------------------------------
-- Coordonnées : soi-même toujours, ou admin/bureau/responsable. Un membre
-- simple ne peut pas lire le téléphone d'un tiers, y compris en appel
-- direct à l'API REST sur cette table.
create policy "profiles_contact_select" on public.profiles_contact
  for select to authenticated
  using (profile_id = auth.uid() or public.can_see_coordonnees());

create policy "profiles_contact_update" on public.profiles_contact
  for update to authenticated
  using (profile_id = auth.uid() or public.is_admin())
  with check (profile_id = auth.uid() or public.is_admin());

-- events -------------------------------------------------------------------
-- Visibilité : "tous" pour tout le monde, "bureau" pour admin/bureau,
-- "role" pour admin/bureau/responsable (visibilité restreinte à
-- l'encadrement). Un admin voit tout, y compris les événements supprimés
-- logiquement (audit/rétablissement).
create policy "events_select" on public.events
  for select to authenticated
  using (
    public.is_admin()
    or (
      deleted_at is null
      and (
        visibilite = 'tous'
        or (visibilite = 'bureau' and public.current_user_role() in ('admin', 'bureau'))
        or (visibilite = 'role' and public.current_user_role() in ('admin', 'bureau', 'responsable'))
      )
    )
  );

-- Créer événement : admin/bureau/responsable uniquement, et seulement en
-- son propre nom (created_by = auth.uid()).
create policy "events_insert" on public.events
  for insert to authenticated
  with check (public.can_create_content() and created_by = auth.uid());

-- Modifier tout événement : admin/bureau. Modifier les siens : responsable
-- (sur les événements qu'il a créés). Couvre aussi la suppression logique
-- (update deleted_at) : aucune policy delete n'est définie donc la
-- suppression physique reste bloquée.
create policy "events_update" on public.events
  for update to authenticated
  using (
    public.can_manage_content()
    or (public.current_user_role() = 'responsable' and created_by = auth.uid())
  )
  with check (
    public.can_manage_content()
    or (public.current_user_role() = 'responsable' and created_by = auth.uid())
  );

-- announcements --------------------------------------------------------
-- Lecture : tous les rôles authentifiés. Publier/modifier/supprimer :
-- admin/bureau uniquement (pas de suppression logique prévue pour les
-- annonces dans le modèle de données).
create policy "announcements_select" on public.announcements
  for select to authenticated
  using (true);

create policy "announcements_insert" on public.announcements
  for insert to authenticated
  with check (public.can_manage_content() and auteur_id = auth.uid());

create policy "announcements_update" on public.announcements
  for update to authenticated
  using (public.can_manage_content())
  with check (public.can_manage_content());

create policy "announcements_delete" on public.announcements
  for delete to authenticated
  using (public.can_manage_content());

-- document_folders -----------------------------------------------------
-- L'arborescence elle-même (juste des noms de dossiers) est visible à tous
-- les rôles authentifiés ; la création suit la même règle que le dépôt de
-- documents.
create policy "document_folders_select" on public.document_folders
  for select to authenticated
  using (true);

create policy "document_folders_insert" on public.document_folders
  for insert to authenticated
  with check (public.can_create_content() and created_by = auth.uid());

create policy "document_folders_update" on public.document_folders
  for update to authenticated
  using (public.can_manage_content())
  with check (public.can_manage_content());

-- documents --------------------------------------------------------------
-- Lecture filtrée par role_minimum (un document réservé au bureau n'est ni
-- listé ni téléchargeable par un membre ou un responsable). Dépôt :
-- admin/bureau/responsable.
create policy "documents_select" on public.documents
  for select to authenticated
  using (
    deleted_at is null
    and public.role_rank(public.current_user_role()) >= public.role_rank(role_minimum)
  );

create policy "documents_insert" on public.documents
  for insert to authenticated
  with check (public.can_create_content() and uploaded_by = auth.uid());

create policy "documents_update" on public.documents
  for update to authenticated
  using (
    public.can_manage_content()
    or (public.current_user_role() = 'responsable' and uploaded_by = auth.uid())
  )
  with check (
    public.can_manage_content()
    or (public.current_user_role() = 'responsable' and uploaded_by = auth.uid())
  );

-- audit_log ----------------------------------------------------------------
-- Écriture : chacun ne peut journaliser qu'à son propre nom (defense in
-- depth ; en pratique les écritures passent par les server actions avec la
-- clé service_role, qui bypass RLS). Lecture : admin uniquement. Aucune
-- policy update/delete : le journal est immuable.
create policy "audit_log_insert" on public.audit_log
  for insert to authenticated
  with check (user_id = auth.uid());

create policy "audit_log_select" on public.audit_log
  for select to authenticated
  using (public.is_admin());
