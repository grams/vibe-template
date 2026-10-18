import { createApp, requireUser, currentUser, type KitEnv } from "vibe-kit";

// Bindings de l'app : ceux du kit + les vôtres (KV, R2, variables…).
type Env = KitEnv;

const app = createApp<Env>({ appName: "Mon app" });

// --- Exemple : notes personnelles (à remplacer par votre app) ---

app.get("/api/notes", requireUser, async (c) => {
  const user = currentUser(c);
  const { results } = await c.env.DB.prepare(
    "SELECT id, text, created_at FROM notes WHERE user_id = ? ORDER BY created_at DESC",
  )
    .bind(user.id)
    .all();
  return c.json(results);
});

app.post("/api/notes", requireUser, async (c) => {
  const user = currentUser(c);
  const body = await c.req.json<{ text?: string }>().catch(() => ({ text: undefined }));
  const text = body.text?.trim();
  if (!text) return c.json({ error: "Le texte est vide" }, 400);
  if (text.length > 2000) return c.json({ error: "Texte trop long (2000 caractères max)" }, 400);
  const note = await c.env.DB.prepare(
    "INSERT INTO notes (user_id, text) VALUES (?, ?) RETURNING id, text, created_at",
  )
    .bind(user.id, text)
    .first();
  return c.json(note, 201);
});

app.delete("/api/notes/:id", requireUser, async (c) => {
  const user = currentUser(c);
  // Toujours filtrer par user_id : un utilisateur ne doit jamais toucher les données d'un autre.
  const { meta } = await c.env.DB.prepare("DELETE FROM notes WHERE id = ? AND user_id = ?")
    .bind(Number(c.req.param("id")), user.id)
    .run();
  if (!meta.changes) return c.json({ error: "Note introuvable" }, 404);
  return c.body(null, 204);
});

export default app;
