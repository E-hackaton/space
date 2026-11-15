# FORBITS · Machines de la Lune (figures Anatomy)

Figures interactives des machines laissées sur la Lune, dessinées pièce par pièce (dessin isométrique et mode 3D à 360°). Chaque page est **un seul fichier HTML autonome** : pas de serveur, pas d'installation. Il suffit de l'ouvrir dans un navigateur.

## Partager

- **Le plus simple** : envoyer `forbits-machines-lune.zip` (le contenu de `pages/`), ou le dossier `pages/` lui-même.
- Ouvrir `pages/index.html` : la page d'accueil relie toutes les figures.
- Les polices viennent de Google Fonts. Sans internet, les pages fonctionnent quand même, avec les polices du système.

## Arborescence

```
lm-anatomy/
├── pages/                      ← À PARTAGER : les pages finies, autonomes
│   ├── index.html                 accueil, liens vers les figures
│   ├── lunar-module-3d.html       Module lunaire Eagle · 360°   (+ -light : thème clair)
│   ├── lunar-module.html          Module lunaire Eagle · vue 2D (+ -light)
│   ├── lunar-rover-3d.html        Rover lunaire LRV · 360°       (+ -light)
│   └── surveyor-3d.html           Surveyor 3 · 360°              (+ -light)
├── src/                        ← sources, un dossier par machine
│   ├── shared/
│   │   ├── forbits.css            jetons du design system « Laissés là-haut » appliqués au kit
│   │   └── turntable.css          styles communs aux figures 360°
│   ├── lunar-module/
│   │   ├── model.mjs              vrais chiffres, pièces, textes FR/EN
│   │   ├── build-2d.mjs, live-2d.js   version 2D (décollage, shader du panache)
│   │   └── build-3d.mjs, live-3d.js   version 360°
│   ├── lunar-rover/            model.mjs · build-3d.mjs · live-3d.js
│   └── surveyor/               model.mjs · build-3d.mjs · live-3d.js
├── kit/, scripts/              ← outil Anatomy (moteur de dessin, 3D, audit, captures)
├── dev/captures/               ← captures de vérification (inutile pour partager)
└── package.json                ← commandes de construction
```

Règle : on ne modifie jamais `pages/` à la main. On modifie `src/` et on reconstruit.

## Reconstruire (Node ≥ 20)

```
npm run build                 # les 8 pages
npm run build:lunar-module    # une seule machine (aussi :lunar-rover, :surveyor)
npm run audit:surveyor        # audit géométrique rapide (aussi :lunar-module, :lunar-rover)
```

## Ajouter une machine

1. Copier `src/surveyor/` vers `src/<machine>/` (le plus court des trois exemples).
2. Remplacer `model.mjs` (chiffres, pièces, textes FR/EN), puis la géométrie de `build-3d.mjs`. Chaque pièce porte un nom `<piece>.<partie>`, et `<piece>` correspond à un `id` de `PARTS`.
3. Ajouter une commande `build:<machine>` dans `package.json` et une carte dans `pages/index.html`.

## Les figures

| Figure | Pièces | Interaction | Chiffres (dans `model.mjs`) |
|---|---|---|---|
| Module lunaire Eagle | 211 | 360°, survol, **Décollage** (L) : l'étage de remontée part, le drapeau tombe | APS 15,57 kN, 4 890 kg, gravité 1,62 m/s² |
| Rover lunaire LRV | 114 | 360°, survol, **Rouler** (R) : direction sur les 4 roues, cercle de 3,1 m | empattement 2,29 m, 190 W par roue, 35,9 km |
| Surveyor 3 | 86 | 360°, survol, **Creuser** (D), **1967 / 1969** (A) | bras de 1,5 m, 6 315 images, Apollo 12 à 183 m |

Communs à toutes les figures : glisser ou ← → pour tourner, ↑ ↓ pour parcourir les pièces, Échap pour revenir, bouton FR/EN, et une visite automatique quand personne n'interagit.

## État des vérifications

- La construction 3D prouve qu'un plan séparateur existe pour chaque paire de pièces. L'audit orbital rapide est à 0 sur la géométrie et l'ordre de dessin.
- Défaut connu du mode 3D (bêta) : de petits sauts d'ombrage sur certains cylindres inclinés, à des angles précis (contrôle `continuity`).
- La copie de `kit/turn-audit.mjs` contient une option de diagnostic `LM_CYCLE=1`, qui affiche le vrai cycle quand l'audit en trouve un.
