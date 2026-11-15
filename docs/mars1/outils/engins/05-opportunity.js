// Données de l’engin Opportunity : chiffres, texte et pièces annotées.
// `at` = position dans le modèle normalisé (centré, rayon 1, Y vers le haut).
// Le modèle NASA est un seul nœud, découpé par matériau en Mesh, Mesh_1…Mesh_8 : seuls les panneaux
// solaires (Mesh_2, SolarArrays) et les roues + suspension (Mesh_4, LightGrayMetal) forment une pièce
// isolée ; les autres matériaux mélangent plusieurs pièces, d'où at/more/reach.
export default {
  "id": "opportunity",
  "file": "05-opportunity.glb",
  "source": "05-opportunity.jpeg",
  "page": "https://science.nasa.gov/3d-resources/mars-exploration-rover-opportunity-mer-b/",
  "title": "Opportunity",
  "sub": "rover d'exploration martien (MER-B) · NASA/JPL",
  "facts": [
    ["masse", "185 kg"],
    ["atterrissage", "25 janv. 2004"],
    ["distance", "45,16 km"],
    ["dernier contact", "10 juin 2018"]
  ],
  "intro": "Prévu pour 90 jours, Opportunity a roulé plus de 14 ans et 45 km sur Mars, comme son jumeau Spirit. Le modèle officiel de la NASA pour ce rover est volontairement simplifié.",
  "view": {
    "az": 35,
    "el": 18,
    "dist": 2.9,
    "target": [0.088, -0.02, -0.061]
  },
  "r": 0.05,
  "parts": [
    {
      "id": "cams",
      "name": "Caméras Pancam et Navcam",
      "at": [-0.066, 0.389, -0.169],
      "more": [[-0.085, 0.338, -0.121], [0.105, 0.357, -0.142], [-0.15, 0.33, -0.13], [0.14, 0.33, -0.13], [-0.007, 0.3, -0.13]],
      "reach": 0.1,
      "zoom": 1,
      "desc": "En haut du mât, vers 1,5 m du sol : deux caméras panoramiques couleur (Pancam) aux extrémités, deux caméras de navigation (Navcam) au centre."
    },
    {
      "id": "mast",
      "name": "Mât et Mini-TES",
      "at": [0.018, 0.12, -0.165],
      "more": [[0.018, 0.026, -0.178], [0.018, 0.2, -0.17], [-0.007, 0.07, -0.14], [0.018, -0.04, -0.17], [-0.007, -0.04, -0.14]],
      "reach": 0.06,
      "zoom": 1.1,
      "desc": "Le mât sert aussi de périscope au spectromètre infrarouge Mini-TES, logé dans le corps, qui identifie les minéraux à distance."
    },
    {
      "id": "lga",
      "name": "Antenne à faible gain",
      "at": [0.068, 0.15, -0.42],
      "more": [[0.068, 0.025, -0.412], [0.082, -0.07, -0.412], [0.068, 0.25, -0.425], [0.072, -0.026, -0.46], [0.057, 0.069, -0.46], [0.069, 0.17, -0.45]],
      "reach": 0.055,
      "zoom": 0.9,
      "desc": "Antenne fixe qui émet dans toutes les directions : un lien lent mais sûr avec la Terre."
    },
    {
      "id": "hga",
      "name": "Antenne à grand gain",
      "at": [0.195, -0.001, -0.538],
      "more": [[0.112, 0.001, -0.544], [0.2, 0.04, -0.54], [0.2, -0.04, -0.54]],
      "reach": 0.07,
      "zoom": 0.9,
      "desc": "Disque orientable sur deux axes, pointé vers la Terre pour un lien direct plus rapide."
    },
    {
      "id": "solar",
      "name": "Panneaux solaires",
      "at": [0.316, -0.067, -0.563],
      "reach": 0.05,
      "match": "^Mesh_2$",
      "zoom": 1.6,
      "desc": "Environ 900 Wh par jour à l'arrivée. Le vent martien les a dépoussiérés plusieurs fois, d'où en partie la longévité du rover."
    },
    {
      "id": "web",
      "name": "Boîte électronique chaude",
      "at": [0.094, -0.168, -0.094],
      "more": [[-0.121, -0.19, -0.094], [0.197, -0.192, -0.094], [-0.066, -0.251, -0.094], [0.254, -0.197, -0.3], [-0.052, -0.218, -0.554], [-0.238, -0.216, -0.554], [0.126, -0.234, -0.554], [-0.269, -0.16, -0.3]],
      "reach": 0.1,
      "zoom": 1.3,
      "desc": "Caisson doré isolé à l'aérogel : il garde l'ordinateur et les batteries au chaud pendant les nuits à −100 °C."
    },
    {
      "id": "wheels",
      "name": "Roues et suspension",
      "at": [0.348, -0.365, 0.061],
      "reach": 0.04,
      "match": "^Mesh_4$",
      "zoom": 1.3,
      "desc": "Six roues motrices en aluminium sur une suspension « rocker-bogie », capable de franchir des obstacles de la taille d'une roue (~25 cm)."
    },
    {
      "id": "arm",
      "name": "Bras robotisé",
      "at": [0.006, -0.164, 0.564],
      "more": [[-0.002, -0.134, 0.451], [0.002, -0.12, 0.36], [0.02, -0.093, 0.306], [0.038, -0.179, 0.127]],
      "reach": 0.07,
      "zoom": 1.1,
      "desc": "Bras à cinq articulations, replié sous l'avant du rover pendant la route, qui pose les instruments contre les roches et le sol."
    },
    {
      "id": "tools",
      "name": "Instruments du bras",
      "at": [-0.001, -0.193, 0.694],
      "more": [[0.009, -0.194, 0.665], [0.015, -0.219, 0.716]],
      "reach": 0.06,
      "zoom": 0.8,
      "desc": "Tourelle à quatre outils : spectromètres APXS et Mössbauer, microscope imageur et outil d'abrasion des roches (RAT)."
    }
  ]
};
