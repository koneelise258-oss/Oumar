# Corrections locales — OUMAR IPHONE

Modifications apportées :
- `src/data/products.ts` : absence de catalogue en cache => liste vide, plutôt que les produits de démonstration ; le reset local enregistre explicitement `[]`.
- `src/data/videos.ts` : absence de cache => liste vide ; les vidéos Google d’exemple sont filtrées du cache ; le reset local enregistre explicitement `[]`.
- `src/services/storeService.ts` : les vidéos récupérées de Supabase sont filtrées pour exclure les clips Google d’exemple, et le résultat (y compris `[]`) est mis en cache.
- `src/components/AdminDashboard.tsx` : quand Supabase est configuré, les boutons de réinitialisation locale n’affichent plus une fausse confirmation de suppression distante et préviennent que les données distantes sont conservées.

Limites de vérification :
- Le panier `CartDrawer.tsx` ne contient aucun appel à `createOrderRemote` ou `create_store_order` (contrôle par recherche de texte).
- `npm run lint` n’a pas pu démarrer : les dépendances du projet ne sont pas installées (`vite/client` introuvable).
- `npm install --ignore-scripts --no-audit --no-fund` a expiré dans cet environnement ; le build de production n’a donc pas été exécuté.
- Aucune connexion Supabase, requête SQL, migration, modification de données distante ou déploiement n’a été effectué.
