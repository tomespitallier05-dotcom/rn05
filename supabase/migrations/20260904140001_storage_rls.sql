-- Policies RLS sur storage.objects, en remplacement du "tout passe par
-- service_role" prévu initialement (migration 20260904120005_storage.sql) :
-- pour des fichiers appartenant à l'utilisateur (avatar) ou dont l'accès se
-- réduit à une comparaison de rôle déjà modélisée en RLS sur la table
-- documents, une policy directe est plus simple et évite de dépendre de la
-- clé service_role (non disponible pour le développement de cette étape).
-- Seule l'administration des comptes (invitation, lot 4) nécessitera
-- encore service_role, faute d'équivalent RLS à l'API Auth Admin.

-- avatars : chacun gère son propre dossier (avatars/<user_id>/...),
-- visible de tous les authentifiés (photo affichée dans l'annuaire, 1.6).
create policy "avatars_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'avatars');

create policy "avatars_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "avatars_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "avatars_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- documents : la lecture reproduit exactement la policy RLS de la table
-- documents (role_minimum), donc une URL signée ne peut être générée que
-- pour un fichier que l'utilisateur a le droit de voir.
create policy "documents_bucket_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'documents'
    and exists (
      select 1 from public.documents d
      where d.storage_path = storage.objects.name
        and d.deleted_at is null
        and private.role_rank(private.current_user_role()) >= private.role_rank(d.role_minimum)
    )
  );

create policy "documents_bucket_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'documents' and private.can_create_content());

create policy "documents_bucket_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'documents' and private.can_manage_content());
