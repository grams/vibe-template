import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { KitProvider } from "vibe-kit/react";

import "./index.css";
import App from "./App";
import LoginPage from "@/components/auth/LoginPage";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      {/* components : remplace les écrans par défaut du kit par ceux de l'app (ici la page de connexion). */}
      <KitProvider components={{ LoginPage }}>
        <App />
      </KitProvider>
    </BrowserRouter>
  </StrictMode>,
);
