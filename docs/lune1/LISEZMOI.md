# Machines de la Lune : images SVG 3D interactives

Même principe et même visualiseur que `docs/mars1` : **une image SVG autonome par machine** dans `svg/`,
qui contient le modèle 3D et ses pièces annotées (survol : nom et rôle de la pièce ; glisser : tourner ;
molette : zoomer ; double-clic : zoomer sur une pièce).

| Image | Machine | Pièces |
|---|---|---|
| `10-surveyor.svg` | Surveyor 3 | 12 |
| `11-eagle.svg` | Eagle, étage de descente (Apollo 11) | 6 |
| `12-lrv.svg` | Rover lunaire LRV (Apollo 15, 16 et 17) | 12 |
| `13-lrrr-apollo11.svg` | Réflecteur laser d'Apollo 11 | 1 |
| `14-psep-apollo11.svg` | Sismomètre d'Apollo 11 | 1 |

## D'où viennent les modèles

La NASA ne publie pas de modèle 3D de ces machines dans le même format que pour Mars. Les modèles sont donc
les **figures FORBITS Anatomy** (`docs/lm-anatomy`), dessinées pièce par pièce d'après les rapports de
mission NASA cités dans chaque `model.mjs`. Les noms et les rôles des pièces, les chiffres et les
introductions viennent de ces fiches. Le crédit affiché dans chaque image le précise.

Le réflecteur d'Apollo 15 (plus grand, 300 coins de cube : à vérifier) n'a pas de figure : celle
d'Apollo 11 ne le représente pas.

## Reconstruire

```
cd outils
npm install
npx esbuild export-glb.ts --bundle --platform=node --format=esm --outfile=.export-glb.mjs \
  --external:@gltf-transform/core
NODE_PATH=../../../frontend/node_modules node .export-glb.mjs   # glb/ et engins/
node build.mjs                                                  # svg/
cp ../svg/*.svg ../../../frontend/public/engins/
```

`build.mjs`, `viewer.js` et `viewer.css` sont copiés de `docs/mars1/outils` ; seul le crédit est devenu un
champ de chaque engin (`credit`, `creditShort`).
