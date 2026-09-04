-- Même correctif que pour events (20260904150001) : documents_select
-- masquait deleted_at non nul, ce qui aurait bloqué la suppression logique
-- d'un document par admin/bureau/responsable dès l'implémentation de cet
-- écran, pour la même raison (PostgreSQL exige que la ligne résultante
-- d'un UPDATE reste visible selon les policies SELECT).
drop policy "documents_select" on public.documents;
create policy "documents_select" on public.documents
  for select to authenticated
  using (
    private.can_manage_content()
    or (private.current_user_role() = 'responsable' and uploaded_by = (select auth.uid()))
    or (
      deleted_at is null
      and private.role_rank(private.current_user_role()) >= private.role_rank(role_minimum)
    )
  );
