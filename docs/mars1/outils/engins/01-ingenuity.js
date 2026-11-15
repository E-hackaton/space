// Données de l’engin Ingenuity : chiffres, texte et pièces annotées.
// `at` = position dans le modèle normalisé (centré, rayon 1, Y vers le haut).
export default {
  "id": "ingenuity",
  "file": "01-ingenuity.glb",
  "source": "01-ingenuity.jpeg",
  "page": "https://science.nasa.gov/3d-resources/ingenuity-mars-helicopter/",
  "title": "Ingenuity",
  "sub": "hélicoptère martien · NASA/JPL",
  "facts": [
    [
      "masse",
      "1,8 kg"
    ],
    [
      "rotors",
      "1,2 m · ~2 400 tr/min"
    ],
    [
      "1er vol",
      "19 avril 2021"
    ],
    [
      "vols",
      "72"
    ]
  ],
  "intro": "Premier aéronef motorisé à voler sur une autre planète. Arrivé sous le ventre du rover Perseverance, il a volé 72 fois dans une atmosphère cent fois plus ténue que celle de la Terre.",
  "view": {
    "az": 35,
    "el": 6,
    "dist": 2.3,
    "target": [
      0,
      0,
      0
    ]
  },
  "r": 0.05,
  "spin": [
    {
      "node": "rotors_01",
      "axis": [
        0,
        1,
        0
      ],
      "speed": 22
    },
    {
      "node": "rotors_02",
      "axis": [
        0,
        1,
        0
      ],
      "speed": -22
    }
  ],
  "parts": [
    {
      "id": "blades",
      "name": "Pales",
      "at": [
        -0.295,
        0.069,
        0.257
      ],
      "match": "^rotors_",
      "reach": 0.05,
      "zoom": 1.6,
      "desc": "Deux rotors coaxiaux de 1,2 m qui tournent en sens opposés à environ 2 400 tr/min. Pales en mousse gainée de fibre de carbone. Cliquez sur les pales pour les faire tourner.",
      "more": [
        [
          0.214,
          0.201,
          0.439
        ]
      ],
      "toggles": true
    },
    {
      "id": "antenna",
      "name": "Antenne",
      "at": [
        0.001,
        0.31,
        -0.055
      ],
      "reach": 0.035,
      "zoom": 0.7,
      "desc": "Petite antenne radio dressée sur le panneau solaire. Elle dialogue avec le rover Perseverance, qui relaie vers les orbiteurs martiens puis la Terre.",
      "match": "FILLET5003_3$"
    },
    {
      "id": "solar",
      "name": "Panneau solaire",
      "at": [
        0.1,
        0.258,
        0.04
      ],
      "match": "^solar_panel",
      "reach": 0.05,
      "zoom": 1,
      "desc": "Placé au-dessus des rotors, il recharge la batterie pendant la journée martienne."
    },
    {
      "id": "mast",
      "name": "Mât et plateaux cycliques",
      "at": [
        0.003,
        0.148,
        0.016
      ],
      "match": "^parts_",
      "reach": 0.03,
      "zoom": 0.8,
      "desc": "Le mât porte les moteurs des deux rotors. Des servomoteurs inclinent les plateaux cycliques pour changer le pas des pales et diriger l’hélicoptère.",
      "more": [
        [
          0.014,
          0.03,
          0.012
        ]
      ]
    },
    {
      "id": "body",
      "name": "Avionique et fuselage",
      "at": [
        0.097,
        -0.085,
        -0.035
      ],
      "match": "^bus",
      "reach": 0.045,
      "zoom": 1,
      "desc": "Le « cerveau » : l’avionique fait voler et naviguer l’hélicoptère. Le fuselage isolé et chauffé garde l’électronique au chaud pendant les nuits martiennes glaciales."
    },
    {
      "id": "battery",
      "name": "Batteries (dans le fuselage)",
      "at": [
        -0.01,
        -0.1,
        0.097
      ],
      "reach": 0.045,
      "zoom": 1,
      "desc": "Six cellules lithium-ion logées dans le fuselage alimentent les moteurs et les réchauffeurs. Un vol dure au plus environ trois minutes."
    },
    {
      "id": "sensors",
      "name": "Capteurs et caméras",
      "at": [
        0.076,
        -0.172,
        -0.025
      ],
      "match": "^(cams|Cube012_2)",
      "reach": 0.03,
      "zoom": 0.8,
      "desc": "Sous le ventre : centrale inertielle, altimètre laser et caméra de navigation mesurent vitesse, hauteur et cap. Une caméra couleur photographie le terrain.",
      "more": [
        [
          0.002,
          -0.174,
          0.002
        ]
      ]
    },
    {
      "id": "legs",
      "name": "Jambes",
      "at": [
        0.365,
        -0.302,
        0.375
      ],
      "match": "^leg_",
      "reach": 0.05,
      "zoom": 1.4,
      "desc": "Quatre jambes ultralégères en tube de fibre de carbone, terminées par des patins, amortissent l’atterrissage."
    }
  ]
};
