// Données de l'engin Surveyor 3 : chiffres, texte et pièces annotées (généré par export-glb.ts).
// `at` = position dans le modèle normalisé (centré, rayon 1, Y vers le haut).
export default {
  "file": "10-surveyor.glb",
  "credit": "figure FORBITS Anatomy (docs/lm-anatomy), cotes tirées des rapports de mission NASA",
  "creditShort": "figure FORBITS Anatomy, d’après la NASA",
  "page": "https://nssdc.gsfc.nasa.gov/",
  "intro": "Surveyor 3 s'est posée le 20 avril 1967 dans l'Océan des Tempêtes, après deux rebonds : ses moteurs ne s'étaient pas coupés. Son bras a creusé les premières tranchées du sol lunaire et sa caméra a pris 6 315 images. Deux ans et demi plus tard, Apollo 12 s'est posé à 183 m : Pete Conrad et Alan Bean ont démonté la caméra et la pelle pour les rapporter sur Terre. La sonde est toujours là.",
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
  "id": "surveyor-3",
  "title": "Surveyor 3",
  "sub": "sonde lunaire automatique · NASA/JPL",
  "facts": [
    [
      "masse posée",
      "302 kg"
    ],
    [
      "hauteur",
      "3,0 m"
    ],
    [
      "alunissage",
      "20 avr. 1967"
    ],
    [
      "images",
      "6 315"
    ]
  ],
  "parts": [
    {
      "id": "frame",
      "name": "Châssis en treillis",
      "at": [
        0,
        -0.028,
        0.075
      ],
      "match": "^frame$",
      "zoom": 0.9658975227573846,
      "desc": "tubes d'aluminium en trépied · porte tout le reste"
    },
    {
      "id": "retro",
      "name": "Support du rétrofusée",
      "at": [
        0,
        -0.195,
        0.155
      ],
      "match": "^retro$",
      "zoom": 0.6,
      "desc": "le moteur à poudre a été largué après le freinage, à 11 km d'altitude"
    },
    {
      "id": "mast",
      "name": "Mât",
      "at": [
        0,
        0.233,
        0.155
      ],
      "match": "^mast$",
      "zoom": 0.6,
      "desc": "porte l'antenne et le panneau solaire, orientés vers la Terre et le Soleil"
    },
    {
      "id": "legs",
      "name": "Jambes et patins",
      "at": [
        0,
        -0.344,
        -0.012
      ],
      "match": "^legs$",
      "zoom": 1.6,
      "desc": "3 jambes à amortisseur · patins en nid d'abeille écrasable"
    },
    {
      "id": "verniers",
      "name": "Moteurs verniers",
      "at": [
        0,
        -0.26,
        0.099
      ],
      "match": "^verniers$",
      "zoom": 0.6202609203074946,
      "desc": "3 moteurs réglables de 133 à 463 N · ont fait rebondir la sonde deux fois"
    },
    {
      "id": "tanks",
      "name": "Réservoirs",
      "at": [
        0,
        -0.143,
        0.097
      ],
      "match": "^tanks$",
      "zoom": 0.6626209046883006,
      "desc": "3 de carburant et 3 de comburant pour les verniers"
    },
    {
      "id": "antenna",
      "name": "Antenne plane",
      "at": [
        0.086,
        0.339,
        0.155
      ],
      "match": "^antenna$",
      "zoom": 0.6,
      "desc": "antenne grand gain · a envoyé les images vers la Terre"
    },
    {
      "id": "solar",
      "name": "Panneau solaire",
      "at": [
        -0.084,
        0.339,
        0.155
      ],
      "match": "^solar$",
      "zoom": 0.6,
      "desc": "3 960 cellules · 85 W"
    },
    {
      "id": "compartments",
      "name": "Compartiments thermiques",
      "at": [
        0.108,
        -0.131,
        0.195
      ],
      "match": "^compartments$",
      "zoom": 0.6522705682930205,
      "desc": "électronique et batteries, sous des miroirs qui renvoient le Soleil"
    },
    {
      "id": "camera",
      "name": "Caméra TV",
      "at": [
        0.208,
        -0.017,
        0.035
      ],
      "match": "^camera$",
      "zoom": 0.6,
      "desc": "6 315 images · rapportée sur Terre par Apollo 12"
    },
    {
      "id": "omni",
      "name": "Antennes omnidirectionnelles",
      "at": [
        -0.187,
        0.246,
        0.25
      ],
      "match": "^omni$",
      "zoom": 0.812579928561511,
      "desc": "liaison de secours, quelle que soit l'orientation"
    },
    {
      "id": "sampler",
      "name": "Bras d'échantillonnage",
      "at": [
        -0.27,
        -0.231,
        0.005
      ],
      "match": "^sampler$",
      "zoom": 0.6,
      "desc": "portée 1,5 m · pelle de 5 cm · tranchées de 17,5 cm"
    }
  ]
};
