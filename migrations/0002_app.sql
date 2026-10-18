-- Tables de l'app (jamais préfixées kit_). Liées aux utilisateurs du socle par kit_user.id.

-- Profil : attributs propres à l'app, 1:1 avec kit_user.
CREATE TABLE profile (
  user_id TEXT PRIMARY KEY REFERENCES kit_user (id) ON DELETE CASCADE,
  display_name TEXT
);

-- Exemple : notes personnelles. À remplacer par les tables de votre app.
CREATE TABLE note (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES kit_user (id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX note_user_id_idx ON note (user_id);
