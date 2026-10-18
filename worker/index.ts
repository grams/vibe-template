import { createKit, currentUser, requireAdmin, type KitEnv } from "vibe-kit";

// Env vient de worker-configuration.d.ts (généré par `npm run cf-typegen`) ; KitEnv ajoute les secrets du kit.
type AppEnv = Env & KitEnv;

// Attributs propres à l'app, stockés dans la table `profile` (1:1 avec kit_user).
type Profile = { display_name: string | null };

const kit = createKit<AppEnv, Profile>({
  appName: "Mon app",
  // Administrateurs : accès au back-office, toujours autorisés à se connecter.
  admins: ["admin@exemple.fr"],
  // Toutes les routes /api exigent une connexion, sauf celles listées ici.
  protect: { default: "private", public: ["/api/public/*"] },
  profile: {
    table: "profile",
    defaults: (user) => ({ display_name: user.name || user.email.split("@")[0] }),
  },
});

const app = kit.app;

// --- Exemple de route publique ---

app.get("/api/public/hello", (c) => c.json({ message: "Bonjour !" }));

// --- Profil de l'utilisateur connecté ---

app.get("/api/profile", async (c) => c.json(await kit.profile.get(c)));

app.put("/api/profile", async (c) => {
  const body = await c.req.json<{ display_name?: string }>().catch(() => ({}) as { display_name?: string });
  const name = body.display_name?.trim();
  if (!name) return c.json({ error: "Le nom est vide" }, 400);
  if (name.length > 60) return c.json({ error: "Nom trop long (60 caractères max)" }, 400);
  return c.json(await kit.profile.update(c, { display_name: name }));
});

// --- Exemple : notes personnelles (à remplacer par votre app) ---

app.get("/api/notes", async (c) => {
  const user = currentUser(c);
  const { results } = await c.env.DB.prepare(
    "SELECT id, text, created_at FROM note WHERE user_id = ? ORDER BY created_at DESC, id DESC",
  )
    .bind(user.id)
    .all();
  return c.json(results);
});

app.post("/api/notes", async (c) => {
  const user = currentUser(c);
  const body = await c.req.json<{ text?: string }>().catch(() => ({}) as { text?: string });
  const text = body.text?.trim();
  if (!text) return c.json({ error: "Le texte est vide" }, 400);
  if (text.length > 2000) return c.json({ error: "Texte trop long (2000 caractères max)" }, 400);
  const note = await c.env.DB.prepare("INSERT INTO note (user_id, text) VALUES (?, ?) RETURNING id, text, created_at")
    .bind(user.id, text)
    .first();
  return c.json(note, 201);
});

app.delete("/api/notes/:id", async (c) => {
  const user = currentUser(c);
  // Toujours filtrer par user_id : un utilisateur ne doit jamais toucher les données d'un autre.
  const { meta } = await c.env.DB.prepare("DELETE FROM note WHERE id = ? AND user_id = ?")
    .bind(Number(c.req.param("id")), user.id)
    .run();
  if (!meta.changes) return c.json({ error: "Note introuvable" }, 404);
  return c.body(null, 204);
});

// --- Back-office de l'app (en plus de celui du kit) ---

app.get("/api/admin/stats", requireAdmin, async (c) => {
  const row = await c.env.DB.prepare(
    "SELECT (SELECT COUNT(*) FROM kit_user) AS users, (SELECT COUNT(*) FROM note) AS notes",
  ).first<{ users: number; notes: number }>();
  return c.json(row);
});

export default app;
