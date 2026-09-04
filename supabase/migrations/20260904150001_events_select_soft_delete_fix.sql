-- Corrige un piège RLS classique : PostgreSQL exige, pour un UPDATE, que la
-- ligne résultante reste visible selon les policies SELECT de la table (en
-- plus du WITH CHECK de la policy UPDATE elle-même). Comme events_select
-- masquait toute ligne deleted_at non nulle, la suppression logique d'un
-- événement (qui EST un UPDATE posant deleted_at) échouait avec
-- "new row violates row-level security policy" pour un bureau/admin,
-- alors que private.can_manage_content() autorisait pourtant l'opération.
--
-- Constaté en le reproduisant directement en SQL (impersonation via
-- request.jwt.claims) : le UPDATE passe dès que la policy SELECT autorise
-- la ligne modifiée, confirmant que le blocage venait bien de là et non de
-- events_update.
--
-- Correction : la clause "peut gérer" de la policy SELECT est désormais
-- exactement symétrique à celle d'events_update (admin/bureau, ou
-- responsable sur ses propres événements), pour que quiconque peut
-- supprimer logiquement une ligne puisse aussi voir le résultat de son
-- action. Utile aussi pour une future corbeille.
drop policy "events_select" on public.events;
create policy "events_select" on public.events
  for select to authenticated
  using (
    private.can_manage_content()
    or (private.current_user_role() = 'responsable' and created_by = (select auth.uid()))
    or (
      deleted_at is null
      and (
        visibilite = 'tous'
        or (visibilite = 'bureau' and private.current_user_role() in ('admin', 'bureau'))
        or (visibilite = 'role' and private.current_user_role() in ('admin', 'bureau', 'responsable'))
      )
    )
  );
