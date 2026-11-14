# Frontend Sankofa (React + TypeScript + Vite)

Voir le [README principal](../README.md) pour lancer le projet complet.

## Organisation de `src/`

| Dossier | Rôle |
|---|---|
| `api/` | Appels HTTP typés vers l'API Django |
| `types/` | Types des réponses de l'API, à garder alignés sur les serializers Django |
| `hooks/` | Logique réutilisable : chargement de données (`useApi`), collection de cartes |
| `lib/` | Fonctions pures : géographie des cartes, dates, stockage local |
| `content/` | Libellés de l'interface et cartes de fond (avec leurs crédits) |
| `components/` | Composants réutilisables (carte, badge, quiz, Sankofa…) |
| `pages/` | Une page par route (voir `router.tsx`) |
| `styles/` | Thème (charte Space Apps), styles globaux et éléments partagés |

## Conventions

- TypeScript en mode `strict`, aucun `any`.
- CSS Modules : un fichier `.module.css` à côté de chaque composant ; les couleurs passent par
  les variables de `styles/theme.css`.
- Accessibilité : vrais `<button>` et `<a>`, libellés textuels à côté des icônes et des couleurs,
  focus clavier visible.
- Aucun logo ni élément de marque NASA (règle du concours).

## Scripts

```bash
npm run dev     # serveur de développement (http://localhost:5173), avec proxy vers Django
npm run build   # vérification TypeScript + build de production dans dist/
npm run lint    # oxlint
```
