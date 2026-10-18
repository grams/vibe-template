import { Route, Routes } from "react-router";
import { Protected } from "vibe-kit/react";

import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Notes from "@/pages/Notes";
import Admin from "@/pages/Admin";
import NotFound from "@/pages/NotFound";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Page publique */}
        <Route index element={<Home />} />
        {/* Pages réservées aux utilisateurs connectés */}
        <Route
          path="app"
          element={
            <Protected>
              <Notes />
            </Protected>
          }
        />
        {/* Back-office : réservé aux admins déclarés dans worker/index.ts */}
        <Route
          path="admin"
          element={
            <Protected admin>
              <Admin />
            </Protected>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
