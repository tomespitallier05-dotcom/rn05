-- Schéma de base RN05 : extensions, enums, tables.
-- Convention : suppression logique (deleted_at) sur profiles, events, documents.
-- Les coordonnées (téléphone) vivent dans une table séparée (profiles_contact)
-- car PostgREST authentifie tous les utilisateurs sous le même rôle Postgres
-- "authenticated" : seule une policy RLS sur une relation distincte peut
-- réellement bloquer une colonne pour un rôle applicatif donné (un GRANT
-- colonne ne le peut pas, faute de rôles Postgres distincts par rôle métier).

create extension if not exists pgcrypto;

create type public.role_utilisateur as enum ('admin', 'bureau', 'responsable', 'membre');
create type public.statut_compte as enum ('actif', 'suspendu', 'archive');
create type public.categorie_evenement as enum ('reunion', 'evenement', 'deplacement', 'permanence');
create type public.visibilite_evenement as enum ('tous', 'bureau', 'role');
create type public.categorie_annonce as enum ('organisation', 'evenement', 'communication', 'urgent');

-- profiles : annuaire, une ligne par utilisateur auth.users, créée par trigger
-- à l'inscription (voir migration triggers). Les champs d'identité sont
-- nullable au niveau colonne (la ligne existe avant l'onboarding) mais
-- deviennent obligatoires dès que onboarding_complete passe à true (check).
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  prenom text,
  nom text,
  commune text,
  profession text,
  secteur text,
  fonction_rn text,
  bio text,
  photo_url text,
  role public.role_utilisateur not null default 'membre',
  statut public.statut_compte not null default 'actif',
  onboarding_complete boolean not null default false,
  consentement_traitement_le timestamptz,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz,
  deleted_at timestamptz,
  constraint onboarding_requiert_identite check (
    onboarding_complete = false
    or (prenom is not null and nom is not null and commune is not null and fonction_rn is not null)
  )
);

comment on table public.profiles is 'Annuaire des membres. Le téléphone est stocké à part dans profiles_contact (accès restreint par RLS).';

-- profiles_contact : coordonnées sensibles, table séparée pour que la
-- restriction "un membre simple ne voit pas les téléphones" soit imposée par
-- Postgres/RLS et pas seulement par le frontend.
create table public.profiles_contact (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  telephone text
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  titre text not null,
  description text,
  debut timestamptz not null,
  fin timestamptz not null,
  lieu text,
  categorie public.categorie_evenement not null,
  couleur text,
  organisateur_id uuid references public.profiles (id),
  visibilite public.visibilite_evenement not null default 'tous',
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint fin_apres_debut check (fin >= debut)
);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  titre text not null,
  corps text not null,
  categorie public.categorie_annonce not null,
  epingle boolean not null default false,
  auteur_id uuid not null references public.profiles (id),
  publie_le timestamptz not null default now()
);

create table public.document_folders (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  parent_id uuid references public.document_folders (id) on delete cascade,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  description text,
  storage_path text not null,
  mime text not null,
  taille bigint not null,
  dossier_id uuid references public.document_folders (id),
  role_minimum public.role_utilisateur not null default 'membre',
  uploaded_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id),
  action text not null,
  table_cible text not null,
  id_cible uuid,
  ip inet,
  user_agent text,
  created_at timestamptz not null default now()
);

comment on table public.audit_log is 'Journal append-only : aucune policy update/delete n''est définie, donc la modification est bloquée par défaut par RLS.';

create index events_debut_idx on public.events (debut) where deleted_at is null;
create index announcements_publie_le_idx on public.announcements (publie_le desc);
create index documents_dossier_idx on public.documents (dossier_id) where deleted_at is null;
create index audit_log_user_idx on public.audit_log (user_id, created_at desc);
create index audit_log_table_cible_idx on public.audit_log (table_cible, id_cible);
