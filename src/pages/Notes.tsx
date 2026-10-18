import { useEffect, useState, type FormEvent } from "react";
import { api } from "vibe-kit/react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Profile = { user_id: string; display_name: string | null };
type Note = { id: number; text: string; created_at: string };

/** Exemple de page réservée : profil de l'app + notes personnelles. */
export default function Notes() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api<Profile>("/api/profile"), api<Note[]>("/api/notes")])
      .then(([p, n]) => {
        setProfile(p);
        setName(p.display_name ?? "");
        setNotes(n);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  async function saveName(event: FormEvent) {
    event.preventDefault();
    try {
      const p = await api<Profile>("/api/profile", { method: "PUT", body: { display_name: name } });
      setProfile(p);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function addNote(event: FormEvent) {
    event.preventDefault();
    try {
      const note = await api<Note>("/api/notes", { body: { text } });
      setNotes((list) => [note, ...list]);
      setText("");
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function removeNote(id: number) {
    try {
      await api(`/api/notes/${id}`, { method: "DELETE" });
      setNotes((list) => list.filter((n) => n.id !== id));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-bold tracking-tight">
        Bonjour{profile?.display_name ? `, ${profile.display_name}` : ""}
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Mon profil</CardTitle>
          <CardDescription>Attribut propre à l'app, stocké dans la table profile.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex gap-2" onSubmit={saveName}>
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} aria-label="Nom affiché" />
            <Button type="submit" variant="secondary">
              Enregistrer
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mes notes</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form className="flex gap-2" onSubmit={addNote}>
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              required
              maxLength={2000}
              placeholder="Nouvelle note…"
              aria-label="Nouvelle note"
            />
            <Button type="submit">Ajouter</Button>
          </form>
          {notes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune note pour l'instant.</p>
          ) : (
            <ul className="grid gap-2">
              {notes.map((note) => (
                <li key={note.id} className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
                  <span className="break-words">{note.text}</span>
                  <Button variant="ghost" size="icon" aria-label="Supprimer" onClick={() => removeNote(note.id)}>
                    <Trash2 />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
