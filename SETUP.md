# Créer une nouvelle app (une fois par app)

Durée : une vingtaine de minutes. Nécessite un compte GitHub, un compte Cloudflare (gratuit) et un compte Google pour la console OAuth.

## 1. Dépôt

1. Sur GitHub : **Use this template** → **Create a new repository** (ex. `mon-app`).
2. Dans le nouveau dépôt, remplacer `mon-app` / `Mon app` :
   - `wrangler.jsonc` : `name` et `database_name` ;
   - `worker/index.ts` : `appName` et la liste `admins` (emails des administrateurs) ;
   - `index.html` : `<title>` ;
   - `package.json` : `name`.

## 2. Base D1

Avec le connecteur Cloudflare (demander à Claude « crée la base D1 mon-app-db ») ou en terminal : `npx wrangler d1 create mon-app-db`.
Reporter l'identifiant obtenu dans `wrangler.jsonc` → `database_id`, puis commiter.

## 3. Identifiants Google

1. https://console.cloud.google.com/apis/credentials → **Créer des identifiants** → **ID client OAuth** → **Application Web**.
2. **URI de redirection autorisés** :
   - `https://mon-app.<compte>.workers.dev/api/kit/auth/callback/google` (production — sert aussi aux aperçus, voir `KIT_PRODUCTION_URL`) ;
   - `http://localhost:5173/api/kit/auth/callback/google` (développement local, facultatif).
3. Garder l'**ID client** et le **code secret**.

## 4. Cloudflare Workers Builds

1. Tableau de bord Cloudflare → **Workers & Pages** → **Create** → **Import a repository** → autoriser GitHub et choisir le dépôt.
2. Réglages de build :
   - **Build command** : `npm run build`
   - **Deploy command** : `npm run ci:deploy`
   - **Non-production branch deploy command** : `npm run ci:preview`
   - activer les builds pour les branches autres que `main` (aperçus).
3. Worker → **Settings** → **Variables and Secrets** → ajouter en type **Secret** :
   - `KIT_AUTH_SECRET` : une longue chaîne aléatoire (`openssl rand -base64 32`) ;
   - `KIT_GOOGLE_CLIENT_ID` et `KIT_GOOGLE_CLIENT_SECRET` ;
   - `KIT_PRODUCTION_URL` : `https://mon-app.<compte>.workers.dev` — la connexion Google des aperçus passe par la production, aucune autre URL à déclarer chez Google ;
   - facultatif, lien de connexion par email : `KIT_RESEND_API_KEY` et `KIT_EMAIL_FROM` ([resend.com](https://resend.com)).
4. Lancer un premier déploiement (push sur `main` ou **Retry build**). Les migrations s'appliquent automatiquement.

## 5. Premier accès

Ouvrir l'URL de production, se connecter avec un email de la liste `admins`, puis **Administration** → **Accès** : inviter des personnes ou autoriser un domaine.

## Développement local (facultatif)

```sh
npm install
cp .dev.vars.example .dev.vars   # mettre KIT_EMAIL_LOG=1 pour se connecter sans Google
npm run db:migrate
npm run dev                      # http://localhost:5173
```
