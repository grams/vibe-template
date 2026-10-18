import { useEffect, useState } from "react";
import { KitAdmin, api } from "vibe-kit/react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** Section propre à l'app, ajoutée au back-office du kit. */
function Stats() {
  const [stats, setStats] = useState<{ users: number; notes: number } | null>(null);
  useEffect(() => {
    api<{ users: number; notes: number }>("/api/admin/stats").then(setStats).catch(() => {});
  }, []);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Statistiques</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        {stats ? `${stats.users} utilisateur(s), ${stats.notes} note(s)` : "Chargement…"}
      </CardContent>
    </Card>
  );
}

/** Back-office : sections du kit (Accès, Utilisateurs) + sections de l'app. */
export default function Admin() {
  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-bold tracking-tight">Administration</h1>
      <KitAdmin sections={[{ id: "stats", label: "Statistiques", render: () => <Stats /> }]} />
    </div>
  );
}
