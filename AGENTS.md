# AGENTS.md — instructions pour l'agent IA

Tu travailles sur une app web **Cloudflare Workers + React**, construite sur le socle **vibe-kit**.
La personne qui te parle n'est généralement pas développeuse et utilise le plus souvent **Claude Desktop** : explique simplement, fais le travail toi-même, et vérifie que ça marche avant de dire que c'est fini.

## Comment on travaille

- Le code vit sur **GitHub**. **Cloudflare Workers Builds** construit et déploie chaque push :
  - une **branche** → une **URL d'aperçu** (visible dans le statut du commit sur GitHub et dans le tableau de bord Cloudflare) ;
  - **`main`** → la **production**.
- Pour une modification : créer une branche, coder, vérifier (`npm run typecheck` puis `npm run build`), commiter, pousser, puis donner à la personne le lien d'aperçu à tester. Fusionner dans `main` **seulement quand elle valide**.
- Ne pas lancer `wrangler login` ni `wrangler deploy` : le déploiement passe par GitHub. (Exception : un humain qui le demande depuis son terminal.)
- **Outils Cloudflare, à privilégier** :
  - connecteur **Cloudflare Developer Platform** : lister les Workers, créer et interroger des bases D1, gérer KV et R2, chercher dans la documentation Cloudflare ;
  - skills Cloudflare (`cloudflare`, `wrangler`, `workers-best-practices`) s'ils sont installés : les consulter avant d'ajouter un service ou un binding.
- Préférer les services natifs Cloudflare (D1, KV, R2, Queues, Cron Triggers…) à des services externes.

## Stack

| Partie | Où | Techno |
|---|---|---|
| API | `worker/index.ts` | Hono, via `createKit()` de vibe-kit |
| Interface | `src/` (pages dans `src/pages/`, routes dans `src/App.tsx`) | React, React Router, Tailwind CSS, shadcn/ui (`src/components/ui/`) |
| Base de données | `migrations/` ; binding `c.env.DB` | Cloudflare D1 (SQLite) |
| Configuration | `wrangler.jsonc`, `vite.config.ts` | Wrangler, plugin Cloudflare pour Vite |
| Types des bindings | `worker-configuration.d.ts` | généré par `npm run cf-typegen` |
| Connexion, accès, back-office | `vibe-kit`, installé depuis GitHub (`package.json`) | Better Auth, Google, invitations, domaines |

## Règle n° 1 : le préfixe `kit` appartient au socle

Tout ce qui porte ce préfixe vient de vibe-kit. **L'app ne crée jamais rien avec ce préfixe et ne modifie jamais ce qui le porte** ; c'est ce qui permet de mettre le kit à jour sans conflit.

| Élément | Au kit (ne pas toucher) | À l'app |
|---|---|---|
| Tables D1 | `kit_*` (`kit_user`, `kit_session`, `kit_invitation`…) | tout autre nom (`note`, `profile`…) |
| Migrations | `migrations/*_kit-*.sql` | `migrations/NNNN_description.sql` |
| Routes | `/api/kit/*` | `/api/…` |
| Variables et secrets | `KIT_*` | autres noms |
| Cookies | `kit.*` | autres noms |
| CSS | classes `.kit-*`, variables `--kit-*` (redéfinir les variables est permis) | Tailwind, shadcn |
| Code | `node_modules/vibe-kit/` | `worker/`, `src/` (ne pas créer de dossier `kit`) |

- **Attributs d'un utilisateur propres à l'app** (pseudo, préférences…) → colonnes de la table `profile` (1:1 avec `kit_user`), lues et écrites via `kit.profile.get(c)` / `kit.profile.update(c, …)`. **Jamais** de colonne ajoutée à `kit_user`.
- Lire `kit_user` (nom, email) dans une jointure est permis ; y écrire, non.

## Règles de sécurité

1. **Ne jamais réimplémenter l'authentification** : pas de table d'utilisateurs maison, pas de mot de passe, pas de JWT, pas d'autre lib d'auth.
2. **Toutes les routes `/api` exigent une connexion** (`protect: { default: "private" }` dans `worker/index.ts`). Une route publique doit être ajoutée explicitement à `protect.public` (ex. `/api/public/*`).
3. **Chaque requête SQL sur des données d'utilisateur filtre par `user_id = currentUser(c).id`**, y compris pour modifier ou supprimer.
4. **Requêtes préparées uniquement** : `c.env.DB.prepare("… WHERE id = ?").bind(id)`. Jamais de concaténation dans du SQL.
5. Côté React, jamais de `dangerouslySetInnerHTML` avec du contenu venant d'un utilisateur.
6. **Secrets** jamais dans le code ni dans `wrangler.jsonc` : en local dans `.dev.vars` (non commité), en prod dans le tableau de bord Cloudflare (Worker → *Settings* → *Variables and Secrets*).
7. **Routes d'administration de l'app** : toujours avec `requireAdmin`. Les admins sont la liste `admins` de `worker/index.ts`.

## API du kit

### Serveur (`worker/index.ts`)

```ts
import { createKit, currentUser, getUser, requireAdmin, isAdmin, type KitEnv } from "vibe-kit";

const kit = createKit<Env & KitEnv, Profile>({ appName, admins, protect, profile });
const app = kit.app;

app.get("/api/taches", async (c) => {
  const user = currentUser(c);                    // { id, name, email, image, … }
  const { results } = await c.env.DB.prepare("SELECT * FROM tache WHERE user_id = ?").bind(user.id).all();
  return c.json(results);
});
app.get("/api/profile", async (c) => c.json(await kit.profile.get(c)));
app.get("/api/admin/export", requireAdmin, async (c) => { … });

export default app;
```

- Erreurs : `return c.json({ error: "message lisible" }, code)` ; le client l'affiche via `KitApiError.message`.
- D1 : `.all()` → `results`, `.first()` → une ligne ou `null`, `.run()` → `meta.changes`. `RETURNING` est supporté.

### Interface (`src/`)

```tsx
import { useKit, Protected, KitAdmin, api } from "vibe-kit/react";

const { user, isAdmin, appName, signOut } = useKit();
const notes = await api<Note[]>("/api/notes");                 // GET
await api("/api/notes", { body: { text } });                   // POST JSON
await api(`/api/notes/${id}`, { method: "DELETE" });

<Route path="app" element={<Protected><MaPage /></Protected>} />          // connecté
<Route path="admin" element={<Protected admin><Admin /></Protected>} />  // admin
```

- **Page publique** : route sans `<Protected>`. **Page réservée** : envelopper dans `<Protected>`.
- **Back-office** : `<KitAdmin sections={[…]} />` (voir `src/pages/Admin.tsx`) fournit Accès (mode, domaines, invitations) et Utilisateurs ; ajouter les sections de l'app dans `sections`.

### Personnaliser l'interface du kit

1. **Thème** : `src/index.css` relie les variables `--kit-*` au thème shadcn. Changer le thème de l'app change aussi le kit.
2. **Remplacer un écran** : `KitProvider components={{ LoginPage, Loading, Forbidden, Admin }}` dans `src/main.tsx`. La page de connexion de l'app est `src/components/auth/LoginPage.tsx`.
3. **Tout refaire** : `useLoginForm()` (connexion) et `useKitAdmin()` (back-office) donnent l'état et les actions, sans interface.

## Ajouter une fonctionnalité

1. **Table** : `npm run db:new nom_du_changement`, puis écrire le SQL dans le fichier créé (colonne `user_id TEXT NOT NULL REFERENCES kit_user (id) ON DELETE CASCADE` pour des données d'utilisateur).
2. **API** : routes dans `worker/index.ts` (protégées par défaut). Si le fichier grossit, découper en modules dans `worker/` (ex. `worker/taches.ts`).
3. **Page** : composant dans `src/pages/`, route dans `src/App.tsx`, lien dans `src/components/Layout.tsx`.
4. **Composants** : `npx shadcn@latest add button dialog …` ; si la commande échoue (réseau), écrire le composant dans `src/components/ui/` sur le modèle des existants.
5. `npm run typecheck && npm run build`, commit, push de la branche, lien d'aperçu.

## Base de données

- Les migrations sont appliquées **automatiquement** à chaque déploiement (aperçu et production partagent la même base).
- Donc **migrations additives uniquement** : ajouter une table ou une colonne (nullable ou avec valeur par défaut). Supprimer ou renommer une table/colonne : **demander à l'humain d'abord**.
- Ne jamais modifier une migration déjà poussée : en créer une nouvelle.
- Consulter les données de prod : connecteur Cloudflare (requête D1 en lecture). Modifier des données de prod : seulement sur demande explicite.

## Tester en local (quand c'est possible)

`cp .dev.vars.example .dev.vars`, y mettre `KIT_EMAIL_LOG=1` (le lien de connexion par email s'affiche dans le terminal), puis `npm run db:migrate` et `npm run dev` → http://localhost:5173. Se connecter avec un email de la liste `admins`.

## Mises à jour de vibe-kit

**En début de session**, lancer `npm run kit:check`. Si une mise à jour est disponible, le signaler en une phrase et proposer de la faire (pas sans accord).

1. Branche dédiée, `git status` propre.
2. `npm run kit:upgrade` : pointe la dépendance sur la dernière version (tag Git de `grams/vibe-kit`), réinstalle et copie les nouvelles migrations `*_kit-*.sql`.
3. Relire `node_modules/vibe-kit/README.md` et adapter l'app si l'API a changé.
4. `npm run typecheck && npm run build`, push, tester l'aperçu (connexion, back-office, fonctionnalités principales), puis fusionner.

En cas de casse non évidente : revenir en arrière et expliquer le problème à l'humain. **Ne jamais modifier `node_modules/vibe-kit`.**

## Ajouter un service Cloudflare

Créer la ressource (connecteur Cloudflare ou `npx wrangler kv namespace create …`, `npx wrangler r2 bucket create …`), déclarer le binding dans `wrangler.jsonc`, lancer `npm run cf-typegen`, puis l'utiliser via `c.env.NOM`.

## Dépannage

| Symptôme | Cause probable |
|---|---|
| `secret KIT_AUTH_SECRET manquant` | Secret absent : `.dev.vars` en local, *Variables and Secrets* en prod |
| `no such table` | Migration non appliquée (`npm run db:migrate` en local ; en prod, vérifier le log de build) |
| Bouton Google absent | `KIT_GOOGLE_CLIENT_ID` / `KIT_GOOGLE_CLIENT_SECRET` non définis |
| Google : `redirect_uri_mismatch` | Déclarer `https://<production>/api/kit/auth/callback/google` chez Google ; sur un aperçu, vérifier le secret `KIT_PRODUCTION_URL` |
| « Accès refusé » à la connexion | Compte non invité et domaine non autorisé : l'ajouter dans Administration → Accès |
| Pas d'onglet Administration | L'email n'est pas dans `admins` (`worker/index.ts`) |
| Build Cloudflare en échec | Lire le log du build dans le tableau de bord ; reproduire avec `npm run build` |

## Demander à l'humain avant de…

- fusionner dans `main` (mise en production) ;
- supprimer ou renommer une table, une colonne ou des données ;
- mettre à jour vibe-kit ;
- créer une ressource ou un service payant.
