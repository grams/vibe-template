import { useLoginForm, useKit } from "vibe-kit/react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.2 0 24 0 14.6 0 6.6 5.4 2.6 13.3l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-3.1-.4-4.6H24v9h12.4c-.5 2.9-2.2 5.3-4.6 7l7.4 5.7c4.3-4 6.9-9.9 6.9-17.1z" />
      <path fill="#FBBC05" d="M10.5 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.1C.9 16.6 0 20.2 0 24s.9 7.4 2.6 10.7l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.8-5.8l-7.4-5.7c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.9l-7.9 6.1C6.6 42.6 14.6 48 24 48z" />
    </svg>
  );
}

/**
 * Page de connexion de l'app : remplace celle du kit (voir main.tsx).
 * Toute la logique vient de useLoginForm() ; ici, uniquement l'apparence.
 */
export default function LoginPage() {
  const { appName } = useKit();
  const form = useLoginForm();
  const { google, magicLink } = form.providers;

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">{appName}</CardTitle>
          <CardDescription>Connectez-vous pour continuer.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {google && (
            <Button variant="outline" className="w-full" onClick={form.signInWithGoogle}>
              <GoogleIcon /> Continuer avec Google
            </Button>
          )}

          {google && magicLink && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> ou <span className="h-px flex-1 bg-border" />
            </div>
          )}

          {magicLink && (
            <form className="grid gap-2" onSubmit={form.submitEmail}>
              <Label htmlFor="email">Recevoir un lien par email</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="vous@exemple.fr"
                value={form.email}
                onChange={(e) => form.setEmail(e.target.value)}
              />
              <Button type="submit" disabled={form.status === "sending"}>
                Envoyer le lien
              </Button>
            </form>
          )}

          {!google && !magicLink && (
            <p className="text-sm text-destructive">
              Aucune méthode de connexion configurée : renseigner KIT_GOOGLE_CLIENT_ID et KIT_GOOGLE_CLIENT_SECRET.
            </p>
          )}
          {form.status === "sent" && <p className="text-sm text-muted-foreground">Lien envoyé, vérifiez vos emails.</p>}
          {form.error && (
            <p role="alert" className="text-sm text-destructive">
              {form.error}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
