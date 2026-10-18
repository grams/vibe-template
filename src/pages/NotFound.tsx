import { Link } from "react-router";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="grid gap-4 py-10">
      <h1 className="text-2xl font-bold">Page introuvable</h1>
      <div>
        <Button asChild variant="outline">
          <Link to="/">Retour à l'accueil</Link>
        </Button>
      </div>
    </section>
  );
}
