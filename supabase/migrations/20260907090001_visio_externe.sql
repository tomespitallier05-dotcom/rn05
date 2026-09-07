-- Réunions à plusieurs (lot 2, partie B) : lien externe uniquement, aucun
-- développement WebRTC. Le lien https est validé à la fois côté
-- application (Zod) et ici (contrainte), même règle que le reste du
-- projet (défense en profondeur) — un lien non-https n'entre jamais en
-- base, quel que soit le chemin d'écriture.

alter table public.events
  add column lien_visio text,
  add column visio_fournisseur text,
  add constraint lien_visio_https check (lien_visio is null or lien_visio like 'https://%'),
  add constraint visio_fournisseur_valeurs check (visio_fournisseur is null or visio_fournisseur in ('jitsi', 'autre'));

comment on column public.events.lien_visio is
  'Lien de visioconférence externe (Jitsi généré ou autre service) pour une réunion à plusieurs. Aucun appel 1↔1 ne passe par ce champ.';
