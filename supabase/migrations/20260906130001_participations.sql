-- Réponses de présence aux événements d'agenda + statistiques agrégées.
--
-- Séparation stricte compteurs/noms (RGPD, engagement politique) : les
-- comptages passent par compteurs_participation() (aucun identifiant), les
-- noms ne sont lisibles en direct sur la table que par l'organisateur,
-- le bureau et les admins — appliqué en RLS, pas seulement à l'affichage.

alter table public.events
  add column reponse_attendue boolean not null default false,
  add column date_limite_reponse timestamptz;

comment on column public.events.reponse_attendue is
  'Si vrai, les membres concernés peuvent répondre présent/absent/peut-être (table participations). Toutes les occasions n''appellent pas une réponse (ex. permanence ouverte).';

create table public.participations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  reponse text not null check (reponse in ('present', 'absent', 'peut_etre')),
  commentaire text,
  repondu_le timestamptz not null default now(),
  unique (event_id, user_id)
);

comment on table public.participations is
  'Réponses de présence. Pas de policy DELETE : changer d''avis est une UPDATE (garde repondu_le à jour), jamais une suppression.';

create index participations_event_idx on public.participations (event_id);
create index participations_user_idx on public.participations (user_id);

alter table public.participations enable row level security;

-- SELECT : sa propre ligne toujours ; les autres lignes seulement pour
-- l'organisateur de l'événement, le bureau ou les admins (can_manage_content
-- = role in ('admin','bureau'), défini dans private_schema.sql).
create policy "participations_select" on public.participations
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or private.can_manage_content()
    or exists (
      select 1 from public.events e
      where e.id = participations.event_id and e.organisateur_id = (select auth.uid())
    )
  );

-- INSERT/UPDATE : uniquement sa propre ligne, et seulement si l'événement
-- attend une réponse et que la date limite n'est pas dépassée. Mêmes
-- conditions des deux côtés (USING et WITH CHECK) : la date limite ne
-- dépend pas de ce qui change dans participations, donc pas de piège
-- "soft delete" ici (contrairement à events_select, cf. migration
-- 20260904150001) — mais la clause USING de l'UPDATE doit à elle seule
-- suffire à refuser une tentative de réponse tardive côté serveur.
create policy "participations_insert" on public.participations
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.events e
      where e.id = event_id
        and e.reponse_attendue = true
        and (e.date_limite_reponse is null or e.date_limite_reponse > now())
    )
  );

create policy "participations_update" on public.participations
  for update to authenticated
  using (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.events e
      where e.id = participations.event_id
        and e.reponse_attendue = true
        and (e.date_limite_reponse is null or e.date_limite_reponse > now())
    )
  )
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.events e
      where e.id = event_id
        and e.reponse_attendue = true
        and (e.date_limite_reponse is null or e.date_limite_reponse > now())
    )
  );

-- compteurs_participation : uniquement des nombres, jamais d'identifiants,
-- appelable par tout membre authentifié. Vérifie elle-même que l'appelant
-- peut voir l'événement (même logique que la policy events_select) : étant
-- security definer, un simple `select ... from events` ignorerait sinon
-- silencieusement la RLS et laisserait deviner l'existence/l'affluence
-- d'un événement bureau/encadrement par essais d'UUID.
create or replace function public.compteurs_participation(p_event uuid)
returns table (
  present_count int,
  absent_count int,
  peut_etre_count int,
  sans_reponse_count int
)
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_visibilite public.visibilite_evenement;
  v_deleted_at timestamptz;
  v_eligibles int;
begin
  select visibilite, deleted_at into v_visibilite, v_deleted_at
  from public.events where id = p_event;

  if v_visibilite is null or v_deleted_at is not null then
    return;
  end if;

  if not (
    private.is_admin()
    or v_visibilite = 'tous'
    or (v_visibilite = 'bureau' and private.current_user_role() in ('admin', 'bureau'))
    or (v_visibilite = 'role' and private.current_user_role() in ('admin', 'bureau', 'responsable'))
  ) then
    return;
  end if;

  -- Population éligible = membres actifs qui peuvent voir cet événement,
  -- selon sa visibilité (mêmes règles que events_select). "Sans réponse"
  -- se déduit de cette population, pas d'un total global de la fédération.
  select count(*) into v_eligibles
  from public.profiles p
  where p.statut = 'actif' and p.deleted_at is null
    and (
      v_visibilite = 'tous'
      or (v_visibilite = 'bureau' and p.role in ('admin', 'bureau'))
      or (v_visibilite = 'role' and p.role in ('admin', 'bureau', 'responsable'))
    );

  return query
  select
    count(*) filter (where pa.reponse = 'present')::int,
    count(*) filter (where pa.reponse = 'absent')::int,
    count(*) filter (where pa.reponse = 'peut_etre')::int,
    greatest(v_eligibles - count(*), 0)::int
  from public.participations pa
  where pa.event_id = p_event;
end;
$$;

revoke all on function public.compteurs_participation(uuid) from public, anon;
grant execute on function public.compteurs_participation(uuid) to authenticated;

-- Statistiques : réservées à l'encadrement (admin + bureau), agrégées côté
-- SQL — jamais en récupérant les lignes individuelles pour compter côté
-- client (aucun nom n'y transite de toute façon, cf. compteurs_participation
-- ci-dessus pour la même règle appliquée événement par événement).

create or replace function public.stats_taux_participation_evenements()
returns table (
  event_id uuid,
  titre text,
  debut timestamptz,
  taux_presence numeric
)
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if not private.can_manage_content() then
    raise exception 'Réservé à l''encadrement (bureau ou administrateurs).';
  end if;

  return query
  select
    e.id,
    e.titre,
    e.debut,
    case
      when count(pa.*) filter (where pa.reponse in ('present', 'absent', 'peut_etre')) = 0 then null
      else round(
        100.0 * count(pa.*) filter (where pa.reponse = 'present')
          / count(pa.*) filter (where pa.reponse in ('present', 'absent', 'peut_etre')),
        1
      )
    end as taux_presence
  from public.events e
  left join public.participations pa on pa.event_id = e.id
  where e.reponse_attendue = true
    and e.deleted_at is null
    and e.debut >= now() - interval '6 months'
    and e.debut <= now()
  group by e.id, e.titre, e.debut
  order by e.debut asc;
end;
$$;

create or replace function public.stats_repartition_prochain_evenement()
returns table (
  event_id uuid,
  titre text,
  debut timestamptz,
  present_count int,
  absent_count int,
  peut_etre_count int,
  sans_reponse_count int
)
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_event record;
begin
  if not private.can_manage_content() then
    raise exception 'Réservé à l''encadrement (bureau ou administrateurs).';
  end if;

  select e.id, e.titre, e.debut into v_event
  from public.events e
  where e.reponse_attendue = true and e.deleted_at is null and e.debut >= now()
  order by e.debut asc
  limit 1;

  if v_event.id is null then
    return;
  end if;

  return query
  select v_event.id, v_event.titre, v_event.debut,
    c.present_count, c.absent_count, c.peut_etre_count, c.sans_reponse_count
  from public.compteurs_participation(v_event.id) c;
end;
$$;

create or replace function public.stats_evenements_par_categorie()
returns table (
  categorie public.categorie_evenement,
  total int
)
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if not private.can_manage_content() then
    raise exception 'Réservé à l''encadrement (bureau ou administrateurs).';
  end if;

  return query
  select e.categorie, count(*)::int
  from public.events e
  where e.deleted_at is null
    and e.debut >= now() - interval '12 months'
    and e.debut <= now()
  group by e.categorie
  order by e.categorie;
end;
$$;

revoke all on function public.stats_taux_participation_evenements() from public, anon;
revoke all on function public.stats_repartition_prochain_evenement() from public, anon;
revoke all on function public.stats_evenements_par_categorie() from public, anon;

grant execute on function public.stats_taux_participation_evenements() to authenticated;
grant execute on function public.stats_repartition_prochain_evenement() to authenticated;
grant execute on function public.stats_evenements_par_categorie() to authenticated;
