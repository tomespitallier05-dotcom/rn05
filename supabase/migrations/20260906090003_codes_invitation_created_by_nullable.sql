-- created_by doit accepter NULL : le tout premier code (fondateur, avant
-- qu'aucun profil admin n'existe pour être "créateur") s'insère à la main
-- par SQL, hors de admin_creer_code — voir la procédure de bootstrap dans
-- le README. Tous les codes créés ensuite via l'écran /codes passent par
-- admin_creer_code, qui renseigne toujours created_by = auth.uid().
alter table public.codes_invitation alter column created_by drop not null;
