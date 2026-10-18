# Nouvelle app

Modèle d'app web avec connexion (Google ou lien par email) et base de données, hébergée gratuitement sur Cloudflare.

## Démarrer une nouvelle app

1. Sur GitHub : bouton **Use this template** → **Create a new repository**.
2. Récupérer le dépôt sur l'ordinateur et ouvrir le dossier dans Claude Code.
3. Demander à Claude : « installe le projet ». Il lancera `npm install` puis `npm run setup` (un compte Cloudflare gratuit est nécessaire ; une page de connexion s'ouvrira).
4. Décrire l'app voulue à Claude. Les règles qu'il doit suivre sont dans `AGENTS.md`.

## Commandes utiles

| Commande | Effet |
|---|---|
| `npm run dev` | Lance l'app sur http://localhost:8787 |
| `npm run deploy` | Met l'app en ligne |
| `npm run kit:check` | Vérifie si vibe-kit a une mise à jour |
| `npm run kit:upgrade` | Met à jour vibe-kit |

## Coût

Gratuit dans les limites du plan Workers Free (100 000 requêtes par jour, base D1 incluse). Au-delà, les requêtes échouent jusqu'au lendemain : pas de facture surprise.
