-- Fonctions SECURITY DEFINER utilisées par les policies RLS.
-- Elles lisent public.profiles en bypassant RLS (search_path figé, pas
-- d'injection possible) pour éviter toute récursion des policies sur
-- profiles elle-même.

create or replace function public.current_user_role()
returns public.role_utilisateur
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.current_user_statut()
returns public.statut_compte
language sql
security definer
stable
set search_path = public
as $$
  select statut from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.can_manage_content()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select role in ('admin', 'bureau') from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.can_create_content()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select role in ('admin', 'bureau', 'responsable') from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.can_see_coordonnees()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select role in ('admin', 'bureau', 'responsable') from public.profiles where id = auth.uid()), false);
$$;

-- Ordonne les rôles pour la comparaison "role_minimum" des documents.
create or replace function public.role_rank(r public.role_utilisateur)
returns int
language sql
immutable
as $$
  select case r
    when 'membre' then 1
    when 'responsable' then 2
    when 'bureau' then 3
    when 'admin' then 4
  end;
$$;
