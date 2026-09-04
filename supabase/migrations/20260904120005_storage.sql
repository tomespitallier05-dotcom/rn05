-- Buckets privés. Aucune policy storage.objects n'est créée pour le rôle
-- authenticated : tout accès (upload, téléchargement) passe par une server
-- action utilisant la clé service_role, qui vérifie d'abord les droits via
-- la table documents (role_minimum) puis génère une URL signée à courte
-- durée. RLS reste activée par défaut sur storage.objects, donc l'accès
-- client direct est refusé.

insert into storage.buckets (id, name, public)
values
  ('documents', 'documents', false),
  ('avatars', 'avatars', false)
on conflict (id) do nothing;
