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
| `SUPABASE_SECRET_KEY` | Dashboard Supabase → Project Settings → API Keys → "secret" (optionnelle en local — nécessaire uniquement pour l'invitation/suppression de comptes depuis l'écran d'administration) |

`SUPABASE_SECRET_KEY` ne doit **jamais** être préfixée `NEXT_PUBLIC_` : elle
donne un accès complet à la base et à l'API Auth Admin, en contournant RLS.

## Migrations

Les migrations SQL versionnées vivent dans `supabase/migrations/`. Chaque
fichier est aussi appliqué via l'outil MCP Supabase (`apply_migration`) sur
le projet distant — le dossier local sert de source de vérité et
d'historique, pas d'exécution automatique.

## Inscription fermée : créer le premier compte administrateur

L'application n'expose aucune page d'inscription ni aucun appel à
`supabase.auth.signUp()` : tous les comptes sont créés par invitation
depuis l'écran `/administration`, réservé aux administrateurs. Le tout
premier compte (avant qu'aucun administrateur n'existe pour inviter qui
que ce soit) se crée donc à la main, une seule fois.

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

### 2. Créer le compte fondateur

Dashboard Supabase → **Authentication → Users → Add user → Create new
user**. Renseigner un email et un mot de passe, cocher **"Auto Confirm
User"**.

Cette étape passe par l'API d'administration de Supabase elle-même : elle
fonctionne malgré l'inscription fermée côté application, et ne nécessite
aucune clé dans le code. Le trigger `handle_new_user` crée automatiquement
la ligne correspondante dans `public.profiles`, avec le rôle `membre` par
défaut.

### 3. Promouvoir ce compte en administrateur

Dans l'éditeur SQL du dashboard Supabase, en remplaçant l'email par le
vôtre :

```sql
update public.profiles
set role = 'admin', statut = 'actif'
where id = (select id from auth.users where email = '<votre email>');

-- vérification
select p.role, p.statut, u.email
from public.profiles p
join auth.users u on u.id = p.id
where u.email = '<votre email>';
```

C'est la seule fois où du SQL sert à gérer un compte — toute la gestion
suivante (rôles, statuts, invitations, suppressions RGPD) passe par l'écran
`/administration`.

Connectez-vous ensuite avec cet email/mot de passe, complétez l'onboarding
(prénom, nom, commune, fonction), puis utilisez le bouton "Inviter un
compte" pour tous les comptes suivants.

### 4. Prévoir un second administrateur

Une fois l'écran d'administration accessible, invitez rapidement un second
compte administrateur. Si l'unique administrateur perd son accès (mot de
passe oublié sans email fonctionnel, compte compromis...), plus personne
ne peut gérer les comptes — l'application refuse d'ailleurs explicitement
toute action qui laisserait la fédération sans administrateur actif.

### Envoi des emails d'invitation

Le SMTP par défaut de Supabase est bridé à quelques envois par heure et
réservé aux tests. Avant la première vraie campagne d'invitations,
brancher un SMTP tiers hébergé dans l'UE (Brevo, Scaleway...) dans
Dashboard Supabase → Project Settings → Auth → SMTP Settings — sinon les
envois échouent silencieusement au-delà des premiers essais.
