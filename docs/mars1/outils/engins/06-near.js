// Données de l’engin NEAR Shoemaker : chiffres, texte et pièces annotées.
// `at` = position dans le modèle normalisé (centré, rayon 1, Y vers le haut).
// Le modèle ne contient que 4 nœuds (un par matériau) : les pièces se repèrent
// surtout par leurs points (`at`, `more`, `reach`) ; seuls les panneaux solaires
// ont un nœud à eux (shiny_panels).
export default {
  "id": "near",
  "file": "06-near.glb",
  "source": "06-near.jpeg",
  "page": "https://science.nasa.gov/3d-resources/near-shoemaker/",
  "title": "NEAR Shoemaker",
  "sub": "sonde vers l'astéroïde Éros · NASA/APL",
  "facts": [
    ["masse", "805 kg"],
    ["lancement", "17 fév. 1996"],
    ["orbite d'Éros", "14 fév. 2000"],
    ["posée", "12 fév. 2001"]
  ],
  "intro": "Première sonde à se mettre en orbite autour d'un astéroïde, puis à s'y poser. Elle a étudié Éros pendant un an avant de terminer sa mission à sa surface.",
  "view": { "az": 320, "el": 10, "dist": 2.3, "target": [0, -0.02, 0] },
  "r": 0.05,
  "parts": [
    {
      "id": "solar",
      "name": "Panneaux solaires",
      "at": [-0.45, 0.19, 0.02],
      "more": [[0, 0.19, 0.45], [0.45, 0.19, 0], [0, 0.19, -0.45], [-0.62, 0.19, 0], [0, 0.19, 0.62], [0.62, 0.19, 0], [0, 0.19, -0.62]],
      "reach": 0.2,
      "match": "^shiny_panels$",
      "zoom": 1.6,
      "desc": "Quatre panneaux fixes de 1,8 × 1,2 m, en croix autour de l'antenne. Toute la sonde s'oriente pour les garder face au Soleil."
    },
    {
      "id": "hga",
      "name": "Antenne à grand gain",
      "at": [0.154, 0.174, 0.037],
      "more": [[0.129, 0.172, 0.086], [-0.079, 0.175, -0.142], [0.01, 0.161, -0.124], [0.11, 0.16, -0.05], [0, 0.16, 0], [-0.12, 0.17, -0.02]],
      "reach": 0.07,
      "zoom": 1.1,
      "desc": "Parabole fixe de 1,5 m, sur la même face que les panneaux : pour parler à la Terre, c'est toute la sonde qui se tourne."
    },
    {
      "id": "mag",
      "name": "Magnétomètre",
      "at": [-0.006, 0.33, 0.009],
      "more": [[0, 0.3, 0]],
      "reach": 0.05,
      "zoom": 0.7,
      "desc": "Au sommet du support de la source de l'antenne, loin de l'électronique. Il a cherché un champ magnétique autour d'Éros, sans en trouver."
    },
    {
      "id": "body",
      "name": "Corps de la sonde",
      "at": [-0.13, 0, 0.13],
      "more": [[0, 0.06, 0.18], [0.127, 0.06, 0.127], [0.18, 0.06, 0.0], [0.127, 0.06, -0.127], [0, 0.06, -0.18], [-0.127, 0.06, -0.127], [-0.18, 0.06, -0.0], [-0.127, 0.06, 0.127], [0, -0.13, 0.18], [0.127, -0.13, 0.127], [0.18, -0.13, 0.0], [0.127, -0.13, -0.127], [0, -0.13, -0.18], [-0.127, -0.13, -0.127], [-0.18, -0.13, -0.0], [-0.127, -0.13, 0.127]],
      "reach": 0.12,
      "zoom": 1.4,
      "desc": "Prisme octogonal d'environ 1,7 m, sous isolant doré. Il abrite l'électronique et la propulsion, avec le pont des instruments en bas."
    },
    {
      "id": "msi",
      "name": "Imageur multispectral",
      "at": [-0.18, -0.255, 0.002],
      "more": [[-0.157, -0.267, -0.028]],
      "reach": 0.035,
      "zoom": 0.5,
      "desc": "Caméra à 8 filtres (MSI) qui a photographié tout Éros, jusqu'à quelques centimètres par pixel pendant la descente finale."
    },
    {
      "id": "nis",
      "name": "Spectrographe infrarouge",
      "at": [-0.17, -0.283, 0.164],
      "more": [[-0.148, -0.334, 0.142], [-0.16, -0.25, 0.17]],
      "reach": 0.04,
      "zoom": 0.5,
      "desc": "NIS : décompose la lumière proche infrarouge pour identifier les minéraux de la surface. Un miroir mobile élargit son champ de visée."
    },
    {
      "id": "nlr",
      "name": "Télémètre laser",
      "at": [-0.065, -0.259, 0.157],
      "more": [[-0.042, -0.267, 0.147], [-0.036, -0.257, 0.158]],
      "reach": 0.03,
      "zoom": 0.5,
      "desc": "NLR : mesure la distance au sol par impulsions laser. Des millions de tirs ont donné le relief précis d'Éros."
    },
    {
      "id": "xrs",
      "name": "Capteur de rayons X",
      "at": [0.034, -0.254, 0.167],
      "reach": 0.03,
      "zoom": 0.5,
      "desc": "Compteurs proportionnels à gaz qui captent les rayons X émis par la surface sous le Soleil : ils révèlent les éléments chimiques (Mg, Si, Fe…)."
    },
    {
      "id": "grs",
      "name": "Capteur de rayons gamma",
      "at": [0.092, -0.257, 0.153],
      "more": [[0.099, -0.254, 0.155]],
      "reach": 0.03,
      "zoom": 0.5,
      "desc": "Cristal scintillateur (NaI) dans un bouclier actif. Posé sur Éros, il a mesuré le potassium, le fer et le silicium du sol."
    },
    {
      "id": "thrust",
      "name": "Propulseurs",
      "at": [0.136, -0.249, 0.179],
      "more": [[0.157, -0.268, 0.161], [-0.165, -0.252, -0.136]],
      "reach": 0.025,
      "zoom": 0.5,
      "desc": "Petits moteurs à hydrazine qui orientent la sonde et corrigent sa trajectoire. Ils ont permis la descente en douceur sur Éros."
    }
  ]
};
