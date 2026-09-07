-- Appel 1↔1 intégré (lot 2, partie A). Aucun contenu de conversation en
-- base : le flux média reste pair-à-pair (WebRTC), seule la ligne
-- d'historique (qui a appelé qui, quand, combien de temps) est stockée.
-- Les administrateurs n'ont AUCUN accès à cet historique — qui appelle
-- qui dans une fédération politique n'est volontairement pas centralisé,
-- contrairement à toutes les autres tables du projet où is_admin()
-- donne un accès de secours.

-- Ajoutée avant la table appels : la policy appels_insert plus bas
-- référence ces deux colonnes.
alter table public.profiles
  add column ne_pas_deranger boolean not null default false,
  add column appels_desactives boolean not null default false;

create table public.appels (
  id uuid primary key default gen_random_uuid(),
  appelant_id uuid not null references public.profiles (id),
  appele_id uuid not null references public.profiles (id),
  type text not null check (type in ('audio', 'video')),
  statut text not null default 'sonne' check (statut in ('sonne', 'en_cours', 'termine', 'manque', 'refuse')),
  demarre_le timestamptz,
  termine_le timestamptz,
  duree_secondes int,
  created_at timestamptz not null default now(),
  constraint appelant_different_appele check (appelant_id <> appele_id)
);

comment on table public.appels is
  'Historique d''appels 1↔1 (métadonnées seulement). Le flux audio/vidéo est pair-à-pair via WebRTC et ne transite jamais par cette table ni par le serveur.';

create index appels_appelant_idx on public.appels (appelant_id, created_at desc);
create index appels_appele_idx on public.appels (appele_id, created_at desc);

alter table public.appels enable row level security;

-- SELECT : uniquement les deux participants. Volontairement AUCUNE
-- clause private.is_admin() ici, à la différence de toutes les autres
-- policies select du projet.
create policy "appels_select" on public.appels
  for select to authenticated
  using (appelant_id = (select auth.uid()) or appele_id = (select auth.uid()));

-- INSERT : uniquement en tant qu'appelant soi-même, et refusé si l'appelé
-- a activé "ne pas déranger" ou désactivé la réception d'appels — vérifié
-- ici (RLS) plutôt que seulement côté action serveur, pour qu'un appel
-- direct à l'API ne puisse pas contourner la préférence.
create policy "appels_insert" on public.appels
  for insert to authenticated
  with check (
    appelant_id = (select auth.uid())
    and not exists (
      select 1 from public.profiles p
      where p.id = appele_id and (p.ne_pas_deranger or p.appels_desactives)
    )
  );

-- UPDATE : l'un ou l'autre participant (décrocher, refuser, raccrocher,
-- constater une coupure réseau). protect_appel_participants (plus bas)
-- empêche de changer qui sont ces deux participants.
create policy "appels_update" on public.appels
  for update to authenticated
  using (appelant_id = (select auth.uid()) or appele_id = (select auth.uid()))
  with check (appelant_id = (select auth.uid()) or appele_id = (select auth.uid()));

-- Pas de policy DELETE : l'historique n'est pas supprimable par les
-- participants (cohérent avec audit_log et participations).

create or replace function private.appels_avant_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Critère d'acceptation : un troisième participant ne peut pas
  -- "rejoindre" en réutilisant la ligne — appelant_id/appele_id sont
  -- immuables après création, même pour les deux participants légitimes.
  if new.appelant_id is distinct from old.appelant_id or new.appele_id is distinct from old.appele_id then
    raise exception 'Les participants d''un appel ne peuvent pas être modifiés.';
  end if;

  -- La durée n'est jamais acceptée telle quelle depuis le client : un
  -- participant pourrait sinon déclarer une durée arbitraire. Recalculée
  -- ici à partir de démarre_le/termine_le.
  if new.termine_le is not null then
    new.duree_secondes := case
      when new.demarre_le is not null
        then greatest(0, extract(epoch from (new.termine_le - new.demarre_le))::int)
      else 0
    end;
  end if;

  return new;
end;
$$;

drop trigger if exists appels_avant_update on public.appels;
create trigger appels_avant_update
  before update on public.appels
  for each row execute function private.appels_avant_update();

-- Postgres Changes (pas de canal manuel) pour la notification d'appel
-- entrant : la RLS ci-dessus s'applique automatiquement à la réplication,
-- donc un utilisateur ne reçoit jamais d'événement pour un appel dont il
-- n'est pas participant.
alter publication supabase_realtime add table public.appels;

-- Signalisation SDP/ICE : canal Realtime éphémère privé par appel
-- (topic = 'appel:<id>'), autorisé uniquement pour les deux participants.
-- Postgres Changes ne suffit pas ici (payloads d'offre/réponse/candidats
-- ICE, haute fréquence, jamais persistés) — Realtime Authorization sur
-- realtime.messages joue le même rôle que RLS pour ce canal Broadcast.
create policy "appel_signal_lecture" on realtime.messages
  for select to authenticated
  using (
    exists (
      select 1 from public.appels a
      where 'appel:' || a.id::text = realtime.messages.topic
        and (a.appelant_id = (select auth.uid()) or a.appele_id = (select auth.uid()))
    )
  );

create policy "appel_signal_ecriture" on realtime.messages
  for insert to authenticated
  with check (
    exists (
      select 1 from public.appels a
      where 'appel:' || a.id::text = realtime.messages.topic
        and (a.appelant_id = (select auth.uid()) or a.appele_id = (select auth.uid()))
    )
  );
