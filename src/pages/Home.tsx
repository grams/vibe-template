import { Link } from "react-router";
import { useKit } from "vibe-kit/react";

import { Button } from "@/components/ui/button";

/** Page d'accueil publique (accessible sans connexion). */
export default function Home() {
  const { user, appName } = useKit();

  return (
    <section className="grid gap-6 py-10">
      <h1 className="text-3xl font-bold tracking-tight">{appName}</h1>
      <p className="max-w-prose text-muted-foreground">
        Cette page est publique. Les notes sont réservées aux personnes connectées, l'administration aux admins.
      </p>
      <div>
        <Button asChild>
          <Link to="/app">{user ? "Ouvrir mes notes" : "Se connecter"}</Link>
        </Button>
      </div>
    </section>
  );
}
