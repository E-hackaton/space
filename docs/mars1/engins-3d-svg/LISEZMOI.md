# Engins spatiaux : images SVG 3D interactives

Le dossier `svg/` contient **une image SVG par engin**. Chaque image affiche le modèle 3D officiel de la NASA,
tiré du site NASA 3D Resources (https://science.nasa.gov/3d-resources/), intégré directement dans le fichier.
Il n'y a pas d'application : le fichier `.svg` suffit, sans Internet ni serveur.

## Ouvrir et manipuler

Double-cliquez sur un fichier `.svg` : il s'ouvre dans le navigateur (Chrome, Edge ou Firefox).

- **glisser** : tourner l'engin · **molette** (ou pincer) : zoomer · **clic droit + glisser** : déplacer
- **survoler** une pièce ou un point orange : la pièce s'allume et son annotation (nom + rôle) s'affiche
- **clic** : garder l'annotation affichée · **double-clic** sur une pièce : zoomer dessus · double-clic dans le vide ou **Échap** : vue d'ensemble
- Ingenuity : un clic sur les pales les fait tourner

Pour intégrer une image dans une page web, utilisez `<object data="01-ingenuity.svg" type="image/svg+xml">` ou `<iframe>`.
Avec `<img>`, Word ou PowerPoint, un SVG ne peut pas exécuter de script : il ne serait plus interactif.

| Image | Engin | Modèle NASA 3D Resources |
|---|---|---|
| `01-ingenuity.svg` | Ingenuity | Ingenuity Mars Helicopter |
| `02-insight.svg` | InSight | InSight Cruise Lander (arm deployed) |
| `04-viking.svg` | Viking | Viking Lander |
| `05-opportunity.svg` | Opportunity | Mars Exploration Rover - Opportunity (MER-B) |
| `06-near.svg` | NEAR Shoemaker | NEAR Shoemaker |
| `07-pioneer.svg` | Pioneer 10 | Pioneer 10 |
| `08-dawn.svg` | Dawn | Dawn |
| `09-kepler.svg` | Kepler | Kepler (A) |

## Limites

- **Sojourner (image 03)** : le site NASA 3D Resources ne propose aucun modèle de ce rover, il n'y a donc pas d'image 3D pour lui.
- **Opportunity** : le modèle `.glb` du site est volontairement simplifié. La version détaillée n'existe qu'au format Blender (`.blend`).
- **Viking** : le modèle du site n'a pas de textures (il est blanc), et son « animation » intégrée ne contient qu'une image fixe.
- Certaines pièces des schémas d'origine n'existent pas dans les modèles du site (par ex. sismomètre et GCMS de Viking, Hazcams d'Opportunity, enregistreur de Kepler, prise de pression d'InSight cachée sous son bouclier) : elles ne sont pas annotées.

## Reconstruire (facultatif)

| Dossier / fichier | Rôle |
|---|---|
| `outils/engins/*.js` | un fichier par engin : textes et pièces annotées (`at` = position dans le modèle normalisé : centré, rayon 1, Y vers le haut) |
| `outils/viewer.js`, `outils/viewer.css` | le script et le style intégrés dans chaque SVG |
| `outils/build.mjs` | construit `svg/*.svg` |
| `outils/undraco.mjs` | décompresse les modèles NASA (`modeles/`) vers `outils/glb/` |
| `modeles/` | les modèles `.glb` téléchargés depuis NASA 3D Resources |

```
cd outils
npm install
node undraco.mjs ../modeles ./glb     (une seule fois)
node build.mjs                        (ou : node build.mjs insight)
```
