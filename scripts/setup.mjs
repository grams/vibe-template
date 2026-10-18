#!/usr/bin/env node
// Installation d'une nouvelle app : npm run setup
// Crée la base D1, le secret de session, applique les migrations et fait un premier déploiement.
// Peut être relancé sans risque : les étapes déjà faites sont sautées.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { basename } from "node:path";
import { createInterface } from "node:readline/promises";

const WRANGLER = "wrangler.jsonc";
const PLACEHOLDER = "A_REMPLIR_PAR_SETUP";

const run = (args, opts = {}) =>
  execFileSync("npx", ["wrangler", ...args], { encoding: "utf8", stdio: ["pipe", "pipe", "inherit"], ...opts });
const step = (msg) => console.log(`\n→ ${msg}`);
const read = () => readFileSync(WRANGLER, "utf8");
const setField = (text, key, value) => text.replace(new RegExp(`("${key}"\\s*:\\s*)"[^"]*"`), `$1"${value}"`);

// 1. Compte Cloudflare
step("Vérification du compte Cloudflare");
const who = spawnSync("npx", ["wrangler", "whoami"], { encoding: "utf8" });
if (!/associated with the email|You are logged in/i.test(who.stdout + who.stderr)) {
  console.log("Connexion à Cloudflare (une page va s'ouvrir dans le navigateur)…");
  spawnSync("npx", ["wrangler", "login"], { stdio: "inherit" });
}

// 2. Nom de l'app
let config = read();
let name = config.match(/"name"\s*:\s*"([^"]+)"/)[1];
if (name === "mon-app") {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const fallback = basename(process.cwd()).toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const answer = (await rl.question(`Nom de l'app (minuscules, chiffres, tirets) [${fallback}] : `)).trim();
  rl.close();
  name = (answer || fallback).toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/^-+|-+$/g, "") || "mon-app";
  config = setField(config, "name", name);
  config = setField(config, "database_name", `${name}-db`);
  writeFileSync(WRANGLER, config);
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  pkg.name = name;
  writeFileSync("package.json", JSON.stringify(pkg, null, 2) + "\n");
}
const dbName = config.match(/"database_name"\s*:\s*"([^"]+)"/)[1];

// 3. Base D1
if (config.includes(PLACEHOLDER)) {
  step(`Création de la base D1 « ${dbName} »`);
  let id;
  try {
    id = run(["d1", "create", dbName]).match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/)?.[0];
  } catch {
    // La base existe peut-être déjà : on récupère son id.
    const list = JSON.parse(run(["d1", "list", "--json"]));
    id = list.find((db) => db.name === dbName)?.uuid;
  }
  if (!id) throw new Error("Impossible de récupérer l'id de la base D1.");
  writeFileSync(WRANGLER, read().replace(PLACEHOLDER, id));
  console.log(`  Base créée (${id}).`);
}

// 4. Secret de session (local + prod)
const secret = randomBytes(32).toString("base64url");
if (!existsSync(".dev.vars")) {
  step("Création de .dev.vars (secrets locaux, jamais commité)");
  writeFileSync(
    ".dev.vars",
    `BETTER_AUTH_SECRET=${randomBytes(32).toString("base64url")}\n` +
      `# GOOGLE_CLIENT_ID=\n# GOOGLE_CLIENT_SECRET=\n# RESEND_API_KEY=\n# EMAIL_FROM=Mon app <noreply@mondomaine.fr>\n`,
  );
}

// 5. Migrations
step("Migrations de la base (local puis prod)");
run(["d1", "migrations", "apply", "DB", "--local"], { stdio: "inherit" });
run(["d1", "migrations", "apply", "DB", "--remote"], { stdio: "inherit" });

// 6. Premier déploiement + secret de prod
step("Déploiement");
const out = run(["deploy"]);
const url = out.match(/https:\/\/[^\s]+\.workers\.dev/)?.[0];
const secrets = (() => {
  try {
    return JSON.parse(run(["secret", "list", "--format", "json"])).map((s) => s.name);
  } catch {
    return [];
  }
})();
if (!secrets.includes("BETTER_AUTH_SECRET")) {
  step("Enregistrement du secret de session en prod");
  run(["secret", "put", "BETTER_AUTH_SECRET"], { input: secret });
}

console.log(`
✓ App en ligne : ${url ?? "(voir la sortie de wrangler ci-dessus)"}
  En local : npm run dev → http://localhost:8787

Connexion par email : sans clé Resend, le lien s'affiche dans le terminal de « npm run dev ».
  Pour l'envoyer vraiment : créer une clé sur resend.com puis
    npx wrangler secret put RESEND_API_KEY
    npx wrangler secret put EMAIL_FROM

Connexion Google (facultatif) :
  1. https://console.cloud.google.com/apis/credentials → Créer des identifiants → ID client OAuth → Application Web
  2. URI de redirection autorisés :
       http://localhost:8787/api/auth/callback/google
       ${url ?? "https://VOTRE-APP.workers.dev"}/api/auth/callback/google
  3. npx wrangler secret put GOOGLE_CLIENT_ID
     npx wrangler secret put GOOGLE_CLIENT_SECRET
     et les mêmes valeurs dans .dev.vars pour le local.
`);
