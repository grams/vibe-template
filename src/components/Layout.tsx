import { Link, NavLink, Outlet } from "react-router";
import { useKit } from "vibe-kit/react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navClass = ({ isActive }: { isActive: boolean }) =>
  cn("text-sm text-muted-foreground hover:text-foreground", isActive && "text-foreground font-medium");

export default function Layout() {
  const { user, isAdmin, appName, signOut } = useKit();

  return (
    <div className="min-h-svh">
      <header className="border-b">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <Link to="/" className="font-semibold">
            {appName || "Mon app"}
          </Link>
          <nav className="flex gap-4">
            <NavLink to="/app" className={navClass}>
              Mes notes
            </NavLink>
            {isAdmin && (
              <NavLink to="/admin" className={navClass}>
                Administration
              </NavLink>
            )}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            {user ? (
              <>
                <span className="hidden text-sm text-muted-foreground sm:inline">{user.email}</span>
                <Button variant="ghost" size="sm" onClick={() => signOut()}>
                  Déconnexion
                </Button>
              </>
            ) : (
              <Button asChild size="sm">
                <Link to="/app">Se connecter</Link>
              </Button>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
