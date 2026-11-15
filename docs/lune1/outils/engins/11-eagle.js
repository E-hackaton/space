// Données de l'engin Eagle · étage de descente : chiffres, texte et pièces annotées (généré par export-glb.ts).
// `at` = position dans le modèle normalisé (centré, rayon 1, Y vers le haut).
export default {
  "file": "11-eagle.glb",
  "credit": "figure FORBITS Anatomy (docs/lm-anatomy), cotes tirées des rapports de mission NASA",
  "creditShort": "figure FORBITS Anatomy, d’après la NASA",
  "page": "https://nssdc.gsfc.nasa.gov/",
  "intro": "Le 21 juillet 1969, l'étage de remontée d'Eagle a décollé en se servant de l'étage de descente comme rampe de lancement. Cet étage est resté dans la mer de la Tranquillité, avec le réflecteur laser et le sismomètre.",
  "view": {
    "az": 35,
    "el": 20,
    "dist": 3.3,
    "target": [
      0,
      0,
      0
    ]
  },
  "r": 0.045,
  "id": "apollo-11-eagle",
  "title": "Eagle · étage de descente",
  "sub": "module lunaire d'Apollo 11 · NASA/Grumman",
  "facts": [
    [
      "alunissage",
      "20 juil. 1969"
    ],
    [
      "moteur de descente",
      "45 kN"
    ],
    [
      "site",
      "0,674° N · 23,473° E"
    ]
  ],
  "parts": [
    {
      "id": "descent",
      "name": "Étage de descente",
      "at": [
        0,
        0.05,
        -0.059
      ],
      "match": "^descent$",
      "zoom": 0.8302018965445529,
      "desc": "servit de rampe de lancement · resté sur la Lune"
    },
    {
      "id": "dps",
      "name": "Moteur de descente",
      "at": [
        0,
        -0.112,
        -0.059
      ],
      "match": "^dps$",
      "zoom": 0.6,
      "desc": "45 kN · premier moteur-fusée à poussée réglable piloté"
    },
    {
      "id": "mesa",
      "name": "MESA et caméra TV",
      "at": [
        0.192,
        0.03,
        -0.251
      ],
      "match": "^mesa$",
      "zoom": 0.6,
      "desc": "a filmé le premier pas pour 600 millions de spectateurs"
    },
    {
      "id": "gear",
      "name": "Train d'atterrissage",
      "at": [
        0,
        -0.053,
        -0.059
      ],
      "match": "^gear$",
      "zoom": 1.6,
      "desc": "4 jambes à amortisseurs en nid d'abeille · patins de 94 cm"
    },
    {
      "id": "probes",
      "name": "Sondes de contact",
      "at": [
        0,
        -0.208,
        0.265
      ],
      "match": "^probes$",
      "zoom": 1.6,
      "desc": "tiges de 1,73 m · allument « Contact light »"
    },
    {
      "id": "ladder",
      "name": "Échelle, plate-forme et plaque",
      "at": [
        0,
        0.066,
        -0.416
      ],
      "match": "^ladder$",
      "zoom": 0.6,
      "desc": "9 barreaux · « Ici des hommes de la planète Terre… »"
    }
  ]
};
