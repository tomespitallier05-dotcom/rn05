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
- **Auth** : Supabase Auth (magic link + mot de passe), inscription fermée
- **Fichiers** : Supabase Storage, buckets privés, URLs signées
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

### Envoi des emails d'invitation

Le SMTP par défaut de Supabase est bridé à quelques envois par heure et
réservé aux tests. Avant la première vraie campagne d'invitations,
brancher un SMTP tiers hébergé dans l'UE (Brevo, Scaleway...) dans
Dashboard Supabase → Project Settings → Auth → SMTP Settings — sinon les
envois échouent silencieusement au-delà des premiers essais.
