# RN05 — Plateforme interne

Outil interne de la fédération départementale du Rassemblement National des
Hautes-Alpes : gestion des adhérents, agenda collaboratif, communication
interne, documentation. Usage strictement privé.

## Stack

- **Frontend** : Next.js 15 (App Router), TypeScript strict, Tailwind CSS,
  shadcn/ui
- **Backend** : Server Actions Next.js (pas de backend séparé)
- **Base** : PostgreSQL via Supabase (région UE, Frankfurt/Paris), RLS
  activée sur toutes les tables
- **Auth** : Supabase Auth (mot de passe), inscription fermée
- **Fichiers** : Supabase Storage, buckets privés, URLs signées
- **Temps réel** : Supabase Realtime (Postgres Changes + canaux Broadcast
  privés) pour la présence en ligne et la signalisation d'appel
- **Appel 1↔1** : WebRTC natif (pas de SFU, pas de bibliothèque tierce),
  TURN obligatoire en production — voir "Appel 1↔1 (WebRTC)" plus bas
- **Déploiement** : Vercel, région `cdg1` (Paris) — voir `vercel.json`

## Développement local

```bash
npm install
npm run dev
```

Copier `.env.example` en `.env.local` et renseigner :

| Variable | Où la trouver |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Dashboard Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Dashboard Supabase → Project Settings → API Keys → "publishable" |
| `NEXT_PUBLIC_SITE_URL` | URL du déploiement (`http://localhost:3000` en local) |
| `SUPABASE_SECRET_KEY` | Dashboard Supabase → Project Settings → API Keys → "secret" (optionnelle en local — nécessaire pour l'invitation/suppression de comptes depuis `/administration` et pour la création de compte par code sur `/creer-un-compte`) |
| `SIGNUP_CODE_PEPPER` | `openssl rand -hex 32` — voir "Création de compte par code" ci-dessous |
| `NEXT_PUBLIC_TURN_URL` | Serveur TURN, voir "Appel 1↔1 (WebRTC)" ci-dessous (optionnelle en local : sans elle, seuls les appels sur le même réseau fonctionnent) |
| `NEXT_PUBLIC_TURN_USERNAME` | Identifiant du serveur TURN |
| `NEXT_PUBLIC_TURN_CREDENTIAL` | Mot de passe/credential du serveur TURN |

`SUPABASE_SECRET_KEY` ne doit **jamais** être préfixée `NEXT_PUBLIC_` : elle
donne un accès complet à la base et à l'API Auth Admin, en contournant RLS.

`SIGNUP_CODE_PEPPER` non plus : elle ne doit exister que côté serveur.
**Changer sa valeur invalide immédiatement tous les codes déjà générés**
(leur empreinte SHA-256 ne correspondra plus à ce qui est stocké en base) —
à traiter comme une rotation de clé, pas comme une variable qu'on modifie
sans conséquence.

## Migrations

Les migrations SQL versionnées vivent dans `supabase/migrations/`. Chaque
fichier est aussi appliqué via l'outil MCP Supabase (`apply_migration`) sur
le projet distant — le dossier local sert de source de vérité et
d'historique, pas d'exécution automatique.

## Création de compte par code

En plus de l'invitation par email depuis `/administration`, un adhérent
peut créer lui-même son compte sur `/creer-un-compte`, verrouillé par un
code que l'administrateur lui communique (SMS, papier, réunion). Cette
page n'appelle jamais `supabase.auth.signUp()` : elle vérifie le code côté
serveur (table `codes_invitation`, jamais lisible via l'API — voir
`supabase/migrations/20260906090001_codes_invitation.sql`) puis crée le
compte via `auth.admin.createUser()`, avec le rôle et le statut portés par
le code. L'auto-inscription Supabase reste désactivée dans tous les cas
(cf. section suivante) : ce n'est pas elle qui est réactivée ici.

Un administrateur génère et révoque ces codes depuis `/codes`. Le code en
clair ne s'affiche qu'une fois, juste après génération — seule son
empreinte (SHA-256 poivrée par `SIGNUP_CODE_PEPPER`) est stockée : un code
perdu se révoque, il ne se retrouve pas.

## Inscription fermée : créer le premier compte administrateur

Tous les comptes sont créés soit par invitation depuis `/administration`,
soit par code depuis `/creer-un-compte` — jamais par
`supabase.auth.signUp()`. Le tout premier compte (avant qu'aucun
administrateur n'existe pour inviter ou générer un code) se crée donc en
utilisant `/creer-un-compte` avec un code fondateur inséré à la main, une
seule fois.

### 1. Vérifier que l'auto-inscription est désactivée côté Supabase

Dashboard Supabase → **Authentication → Sign In / Providers → Email** →
décocher **"Allow new users to sign up"**.

À faire avant toute autre étape : l'URL d'un projet Supabase est devinable
et des bots testent en continu l'endpoint `/auth/v1/signup`.

Vérification (doit répondre que les inscriptions sont désactivées, et ne
jamais créer d'utilisateur) :

```bash
curl -X POST 'https://<project-ref>.supabase.co/auth/v1/signup' \
  -H "apikey: <clé publishable>" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@exemple.fr","password":"Test123456!"}'
```

### 2. Calculer l'empreinte d'un code fondateur

Choisissez vous-même une chaîne secrète pour ce code unique (elle n'a pas
besoin de suivre le format `RN05-XXXX-XXXX` généré par `/codes`, seule sa
normalisation — majuscules, espaces et tirets supprimés — doit être
reproduite). Calculez son empreinte en local avec `node:crypto`, en
remplaçant `<poivre>` par la valeur de `SIGNUP_CODE_PEPPER` et
`<CODE-FONDATEUR>` par le code choisi (déjà normalisé) :

```bash
node -e "console.log(require('crypto').createHash('sha256').update('<poivre>:<CODE-FONDATEUR>').digest('hex'))"
```

### 3. Insérer le code fondateur en base

Dans l'éditeur SQL du dashboard Supabase, avec l'empreinte obtenue à
l'étape précédente :

```sql
insert into public.codes_invitation
  (libelle, code_hash, role_attribue, statut_initial, usages_max, expire_le)
values (
  'Code fondateur',
  '<empreinte calculée à l''étape 2>',
  'admin',
  'actif',
  1,
  now() + interval '2 hours'
);
```

`created_by` reste `null` : aucun profil administrateur n'existe encore
pour être "créateur" de ce code (seul ce cas de bootstrap l'autorise —
tous les codes créés ensuite depuis `/codes` renseignent un `created_by`).

### 4. Créer le compte fondateur via /creer-un-compte

Utilisez normalement `/creer-un-compte` avec le code choisi à l'étape 2 :
email, mot de passe (12 caractères minimum), consentement. Le compte créé
a immédiatement le rôle `admin` et le statut `actif`, portés par le code.

### 5. Vérifier puis désactiver le code fondateur

Dans l'éditeur SQL, en remplaçant l'email par le vôtre :

```sql
select p.role, p.statut, u.email
from public.profiles p
join auth.users u on u.id = p.id
where u.email = '<votre email>';

-- désactive le code fondateur : usages_max=1 l'a déjà rendu inutilisable,
-- ceci retire aussi toute ambiguïté s'il fallait l'identifier plus tard.
update public.codes_invitation set actif = false where libelle = 'Code fondateur';
```

Connectez-vous ensuite, complétez l'onboarding (prénom, nom, commune,
fonction), puis utilisez `/codes` ou le bouton "Inviter un compte" de
`/administration` pour tous les comptes suivants.

### 6. Prévoir un second administrateur

Une fois connecté, invitez rapidement un second compte administrateur. Si
l'unique administrateur perd son accès (mot de passe oublié sans email
fonctionnel, compte compromis...), plus personne ne peut gérer les
comptes — l'application refuse d'ailleurs explicitement toute action qui
laisserait la fédération sans administrateur actif.

## Appel 1↔1 (WebRTC)

Appel audio/vidéo intégré, deux participants maximum (verrouillé côté
serveur — voir `supabase/migrations/20260907120001_appels.sql`). Aucun
flux média ne transite par le serveur ni par la base : la table `appels`
ne stocke que l'historique (qui a appelé qui, quand, combien de temps),
jamais le contenu. **Les administrateurs n'ont volontairement aucun accès
à cet historique**, contrairement à toutes les autres tables du projet.

### TURN obligatoire avant tout usage réel

Sans serveur TURN, **seuls les appels entre deux appareils du même
réseau local fonctionnent** (ce qui rend le problème invisible en
développement). En usage réel, environ 15 à 20 % des connexions passent
par un pare-feu d'entreprise ou un NAT symétrique et échouent sans TURN.

Deux options, toutes deux hébergées **en UE** (obligatoire, RGPD — les
métadonnées de connexion TURN révèlent qui appelle qui) :

- **Service managé** : Xirsys, Twilio (région UE), Cloudflare Calls...
  Le plus rapide à mettre en place, facturé à l'usage.
- **coturn auto-hébergé** sur un VPS en UE (Scaleway, OVH, Hetzner...) :
  gratuit hors coût du VPS, mais demande de le maintenir (mises à jour de
  sécurité, monitoring).

Une fois le service choisi, renseigner `NEXT_PUBLIC_TURN_URL` (une ou
plusieurs URLs séparées par des virgules, ex.
`turn:turn.exemple.eu:3478,turns:turn.exemple.eu:5349`),
`NEXT_PUBLIC_TURN_USERNAME` et `NEXT_PUBLIC_TURN_CREDENTIAL`.

Ces trois variables sont volontairement `NEXT_PUBLIC_` : `RTCPeerConnection`
s'exécute dans le navigateur, qui a nécessairement besoin de ces
identifiants pour s'y connecter — ce n'est pas une fuite, c'est le
fonctionnement normal de WebRTC. En revanche, un identifiant TURN
statique reste valable indéfiniment pour quiconque l'intercepte : pour un
usage réel prolongé, préférer des identifiants à courte durée de vie
(la plupart des services managés et coturn savent générer des
identifiants temporaires signés) plutôt que la paire fixe utilisée ici.
Non implémenté dans cette livraison — amélioration à prévoir si l'usage
se confirme.

### Ce qui ne peut être vérifié qu'en conditions réelles

Les policies RLS et le trigger d'immuabilité des participants ont été
vérifiés rigoureusement par impersonation SQL (transaction annulée,
aucune trace en base). En revanche, rien ne remplace un test avec deux
comptes réels sur deux réseaux différents, TURN configuré :

- L'appel aboutit effectivement entre deux réseaux distincts derrière NAT.
- Le repli audio automatique se déclenche sur une connexion réellement
  dégradée.
- La coupure réseau d'un côté clôt bien l'appel des deux côtés en moins
  de 10 secondes.

### Préférences

`ne_pas_deranger` et `appels_desactives` (colonnes `profiles`) sont
vérifiées dans la policy `appels_insert` elle-même : un appel vers un
membre qui les a activées est refusé côté serveur, pas seulement masqué
dans l'interface. La coupure de sonnerie est une préférence locale à
l'appareil (`localStorage`), volontairement non synchronisée entre
appareils.

### Envoi des emails d'invitation

Le SMTP par défaut de Supabase est bridé à quelques envois par heure et
réservé aux tests. Avant la première vraie campagne d'invitations,
brancher un SMTP tiers hébergé dans l'UE (Brevo, Scaleway...) dans
Dashboard Supabase → Project Settings → Auth → SMTP Settings — sinon les
envois échouent silencieusement au-delà des premiers essais.
