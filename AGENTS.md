# AGENTS.md — instructions pour l'agent IA

Tu travailles sur une app web hébergée sur **Cloudflare Workers**, construite sur la lib maison **vibe-kit**.
La personne qui te parle n'est pas développeuse : explique simplement, lance les commandes toi-même, et vérifie que ça marche avant de dire que c'est fini.

## Stack

- **Serveur** : `src/index.ts`, framework Hono, créé via `createApp()` de vibe-kit.
- **Pages** : `public/` (HTML, CSS, JS simples, sans build ni framework).
- **Base de données** : Cloudflare D1 (SQLite), binding `c.env.DB`, schéma dans `migrations/`.
- **Connexion des utilisateurs** : gérée entièrement par vibe-kit (Google + lien magique par email).

## Règles absolues

1. **Ne jamais réimplémenter l'authentification.** Pas de table d'utilisateurs maison, pas de mot de passe, pas de JWT, pas d'autre lib d'auth. Utiliser `requireUser` / `currentUser(c)` côté serveur et `kit` côté navigateur.
2. **Ne jamais modifier** `node_modules/vibe-kit/`, ni les fichiers `migrations/*_vibekit-*.sql`, ni les tables `user`, `session`, `account`, `verification`. Pour lier des données à un utilisateur : colonne `user_id TEXT NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE`.
3. **Chaque requête SQL sur des données d'utilisateur filtre par `user_id = currentUser(c).id`**, y compris pour modifier ou supprimer. Ne jamais faire confiance à un id envoyé par le navigateur sans ce filtre.
4. **Toujours des requêtes préparées** : `c.env.DB.prepare("... WHERE id = ?").bind(id)`. Jamais de concaténation de chaînes dans du SQL.
5. **Côté navigateur, afficher les données avec `textContent`**, jamais `innerHTML` avec du contenu venant d'un utilisateur.
6. **Secrets** : jamais dans le code ni dans `wrangler.jsonc`. En local dans `.dev.vars` (non commité), en prod via `npx wrangler secret put NOM`.
7. **Ne jamais modifier une migration déjà appliquée.** Toute évolution du schéma = nouvelle migration.

## API vibe-kit

### Serveur (`src/index.ts`)

```ts
import { createApp, requireUser, currentUser, getUser, type KitEnv } from "vibe-kit";

type Env = KitEnv & { MON_BUCKET: R2Bucket }; // ajouter ici les bindings déclarés dans wrangler.jsonc

const app = createApp<Env>({ appName: "Mon app" });

// Route réservée aux utilisateurs connectés (401 sinon)
app.get("/api/taches", requireUser, async (c) => {
  const user = currentUser(c);              // { id, name, email, image, ... }
  const { results } = await c.env.DB.prepare("SELECT * FROM taches WHERE user_id = ?").bind(user.id).all();
  return c.json(results);
});

// Route publique qui adapte sa réponse si quelqu'un est connecté
app.get("/api/accueil", (c) => c.json({ connecte: getUser(c) !== null }));

export default app;
```

- Toutes les routes serveur commencent par **`/api/`** (sinon elles ne passent pas par le Worker).
- Réservé par le kit, ne pas redéfinir : `/api/auth/*`, `/api/kit/*`, `/vibe-kit.js`.
- Erreurs : renvoyer `c.json({ error: "message lisible" }, code)`. Le client affiche `error`.
- D1 : `.all()` (liste → `results`), `.first()` (une ligne ou null), `.run()` (écriture → `meta.changes`). `RETURNING` est supporté.

### Navigateur (`public/`)

Charger `<script src="/vibe-kit.js"></script>` avant le script de la page. Objet global `kit` :

| Fonction | Rôle |
|---|---|
| `await kit.me()` | Utilisateur connecté ou `null`. Remplit aussi `kit.providers.google` (bouton Google à afficher ou non). |
| `kit.signInWithGoogle(retour = page actuelle)` | Redirige vers Google puis revient. |
| `await kit.sendMagicLink(email, retour)` | Envoie le lien de connexion par email. |
| `kit.signOut()` | Déconnecte et recharge la page. |
| `await kit.api(chemin, { method, body })` | Appelle une route `/api/...`. `body` ⇒ POST JSON par défaut. Lève une `Error` (avec `.status`) si échec. |

Exemple complet : `public/app.js` (écran de connexion + liste de notes).

## Base de données

1. `npm run db:new nom_du_changement` → crée `migrations/NNNN_nom_du_changement.sql`.
2. Écrire le SQL (SQLite) dans ce fichier.
3. `npm run db:migrate` → applique en local.
4. Avant de déployer : `npm run db:migrate:remote` → applique en prod.

L'exemple `0002_notes.sql` peut être supprimé tant qu'il n'a pas été appliqué en prod ; sinon créer une migration `DROP TABLE notes;`.

## Lancer, vérifier, déployer

- `npm run dev` → http://localhost:8787. Le lien magique s'affiche dans ce terminal si Resend n'est pas configuré.
- `npm run typecheck` → doit passer sans erreur avant tout déploiement.
- `npm run db:migrate:remote && npm run deploy` → mise en prod.
- Première installation uniquement : `npm run setup` (crée la base, les secrets, déploie).

Après une modification : lancer `npm run typecheck`, tester dans `npm run dev` (connexion + fonctionnalité modifiée), puis proposer de déployer.

## Mises à jour de vibe-kit

vibe-kit est un paquet npm public. Sa documentation est dans `node_modules/vibe-kit/README.md`.

**En début de session de travail**, lancer `npm run kit:check`. Si une mise à jour est disponible, le signaler en une phrase et proposer de la faire (ne pas la faire sans accord).

**Pour mettre à jour** :

1. `git status` doit être propre (sinon commiter d'abord).
2. `npm run kit:upgrade` : installe la dernière version, copie les nouvelles migrations du kit dans `migrations/`, puis indique les étapes suivantes.
3. Relire `node_modules/vibe-kit/README.md` et adapter le code de l'app si l'API a changé.
4. `npm run typecheck`, `npm run db:migrate`, `npm run dev` → vérifier la connexion et les fonctionnalités principales.
5. `npm run db:migrate:remote && npm run deploy`, puis commiter (`chore: vibe-kit X.Y.Z`).

Si la mise à jour casse quelque chose et que la correction n'est pas évidente : revenir en arrière (`git checkout package.json package-lock.json migrations/ && npm install`) et expliquer le problème à l'humain. **Ne jamais contourner en modifiant `node_modules/vibe-kit`.**

## Ajouter un service Cloudflare

Déclarer le binding dans `wrangler.jsonc` (KV, R2…), l'ajouter au type `Env` dans `src/index.ts`, l'utiliser via `c.env.NOM`. Les ressources se créent avec `npx wrangler kv namespace create …` / `npx wrangler r2 bucket create …`.

## Dépannage

| Symptôme | Cause probable |
|---|---|
| `Secret BETTER_AUTH_SECRET manquant` | `.dev.vars` absent (local) ou secret non créé en prod → `npm run setup` |
| `no such table` | Migration non appliquée → `npm run db:migrate` (local) ou `:remote` (prod) |
| Bouton Google absent | `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` non définis (normal si non configuré) |
| Erreur Google `redirect_uri_mismatch` | Ajouter `https://<domaine>/api/auth/callback/google` dans la console Google |
| Email jamais reçu en prod | `RESEND_API_KEY` absent, ou domaine d'envoi `EMAIL_FROM` non vérifié chez Resend |
| Route `/api/...` renvoie la page HTML | Route non déclarée dans `src/index.ts` ou faute de frappe dans le chemin |

## Demander à l'humain avant de…

- supprimer des données ou une table en prod ;
- déployer ;
- mettre à jour vibe-kit ;
- créer un compte ou un service payant.
