// Données de l'engin Rover lunaire (LRV) : chiffres, texte et pièces annotées (généré par export-glb.ts).
// `at` = position dans le modèle normalisé (centré, rayon 1, Y vers le haut).
export default {
  "file": "12-lrv.glb",
  "credit": "figure FORBITS Anatomy (docs/lm-anatomy), cotes tirées des rapports de mission NASA",
  "creditShort": "figure FORBITS Anatomy, d’après la NASA",
  "page": "https://nssdc.gsfc.nasa.gov/",
  "intro": "Trois rovers lunaires sont restés sur la Lune, ceux d'Apollo 15, 16 et 17. Chaque roue a son propre moteur de 190 W, et les deux essieux braquent en sens inverse : le rover tourne ici à son rayon minimal de 3,1 m. Celui d'Apollo 17 a parcouru 35,9 km en trois sorties. Garé à environ 145 m du module lunaire, sa caméra pilotée depuis Houston a filmé le décollage de Challenger le 14 décembre 1972.",
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
  "id": "apollo-15-lrv",
  "title": "Rover lunaire (LRV)",
  "sub": "Apollo 15, 16 et 17 · NASA/Boeing",
  "facts": [
    [
      "masse à vide",
      "210 kg"
    ],
    [
      "charge utile",
      "490 kg"
    ],
    [
      "vitesse max.",
      "13 km/h"
    ],
    [
      "roues",
      "Ø 82 cm"
    ]
  ],
  "parts": [
    {
      "id": "chassis",
      "name": "Châssis pliable",
      "at": [
        0.03,
        -0.174,
        0
      ],
      "match": "^chassis$",
      "zoom": 1.2426596676041068,
      "desc": "3 sections d'aluminium · replié contre le module lunaire pendant le vol"
    },
    {
      "id": "suspension",
      "name": "Suspension",
      "at": [
        0.03,
        -0.227,
        0
      ],
      "match": "^suspension$",
      "zoom": 1.1657199817529553,
      "desc": "doubles bras et barres de torsion · 36 cm de garde au sol"
    },
    {
      "id": "steer",
      "name": "Direction aux 4 roues",
      "at": [
        0.03,
        -0.232,
        0
      ],
      "match": "^steer$",
      "zoom": 1.1332959012544894,
      "desc": "l'avant et l'arrière braquent ensemble · rayon de braquage de 3,1 m"
    },
    {
      "id": "motors",
      "name": "Moteurs de roue",
      "at": [
        0.03,
        -0.236,
        0
      ],
      "match": "^motors$",
      "zoom": 1.2324666935240502,
      "desc": "un moteur de 190 W dans chaque moyeu · 13 km/h au maximum"
    },
    {
      "id": "wheels",
      "name": "Roues en maille",
      "at": [
        0.03,
        -0.236,
        0
      ],
      "match": "^wheels$",
      "zoom": 1.5327920536290236,
      "desc": "Ø 82 cm · corde à piano zinguée · chevrons de titane"
    },
    {
      "id": "fenders",
      "name": "Garde-boue",
      "at": [
        0,
        -0.097,
        0
      ],
      "match": "^fenders$",
      "zoom": 1.6,
      "desc": "Apollo 17 : réparé avec 4 cartes plastifiées et du ruban adhésif"
    },
    {
      "id": "seats",
      "name": "Sièges",
      "at": [
        0.037,
        -0.056,
        0
      ],
      "match": "^seats$",
      "zoom": 0.6,
      "desc": "pliants, en sangles de nylon · ceintures de sécurité"
    },
    {
      "id": "console",
      "name": "Console et manche",
      "at": [
        0.236,
        -0.04,
        0
      ],
      "match": "^console$",
      "zoom": 0.6,
      "desc": "cap, distance, retour au module · un manche en T pour conduire"
    },
    {
      "id": "batteries",
      "name": "Batteries",
      "at": [
        0.436,
        -0.125,
        0
      ],
      "match": "^batteries$",
      "zoom": 0.6,
      "desc": "2 × 36 V argent-zinc · 121 Ah chacune"
    },
    {
      "id": "comms",
      "name": "LCRU et antennes",
      "at": [
        0.543,
        0.114,
        -0.088
      ],
      "match": "^comms$",
      "zoom": 0.8098873922197597,
      "desc": "liaison directe avec la Terre · antenne grand gain en parapluie"
    },
    {
      "id": "camera",
      "name": "Caméra TV",
      "at": [
        0.456,
        -0.011,
        0
      ],
      "match": "^camera$",
      "zoom": 0.6,
      "desc": "pilotée depuis Houston · a filmé le décollage d'Apollo 17"
    },
    {
      "id": "pallet",
      "name": "Porte-outils",
      "at": [
        -0.466,
        0.028,
        0
      ],
      "match": "^pallet$",
      "zoom": 0.6,
      "desc": "pinces, râteau, pelle · sacs d'échantillons"
    }
  ]
};
