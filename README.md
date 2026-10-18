# Mon app

App web avec connexion Google, accès sur invitation et back-office, hébergée gratuitement sur Cloudflare. Construite sur [vibe-kit](https://github.com/grams/vibe-kit).

## Travailler sur l'app avec Claude

**À faire une fois dans Claude Desktop :**
- donner à Claude l'accès à GitHub (dépôt de l'app) ;
- ajouter le connecteur **Cloudflare Developer Platform** ;
- facultatif : installer les skills Cloudflare (dépôt [`cloudflare/skills`](https://github.com/cloudflare/skills)).

**Ensuite :**
1. Décrire à Claude ce que l'app doit faire. Les règles qu'il suit sont dans `AGENTS.md`.
2. Claude pousse ses changements sur une branche ; Cloudflare construit une **version d'aperçu** et Claude donne le lien.
3. Tester l'aperçu. Si c'est bon, dire à Claude de mettre en production : il fusionne dans `main` et Cloudflare met l'app à jour.

**Gérer les accès** : se connecter avec un compte admin, menu **Administration** → inviter des personnes, autoriser des domaines (ex. `famille.fr`), voir et supprimer des utilisateurs.

## Créer une nouvelle app

Voir [SETUP.md](SETUP.md) (une fois par app, idéalement par un développeur).

## Coût

Gratuit dans les limites du plan Workers Free (100 000 requêtes par jour, base D1 incluse). Au-delà, les requêtes échouent jusqu'au lendemain : pas de facture surprise.
