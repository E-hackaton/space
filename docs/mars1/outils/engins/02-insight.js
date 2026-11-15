// Données de l’engin InSight : chiffres, texte et pièces annotées.
// `at` = position dans le modèle normalisé (centré, rayon 1, Y vers le haut).
export default {
  "id": "insight",
  "file": "02-insight.glb",
  "source": "02-insight.jpeg",
  "page": "https://science.nasa.gov/3d-resources/insight-cruise-lander/",
  "title": "InSight",
  "sub": "atterrisseur géophysique · NASA/JPL",
  "facts": [
    [
      "masse",
      "358 kg"
    ],
    [
      "envergure",
      "6 m"
    ],
    [
      "atterrissage",
      "26 nov. 2018"
    ],
    [
      "fin",
      "déc. 2022"
    ]
  ],
  "intro": "InSight s'est posé à Elysium Planitia pour ausculter l'intérieur de Mars : séismes, flux de chaleur et rotation de la planète. Le modèle le montre bras déployé, instruments encore sur le pont.",
  "view": {
    "az": 28,
    "el": 20,
    "dist": 2,
    "target": [
      0.16,
      -0.06,
      0
    ]
  },
  "r": 0.045,
  "parts": [
    {
      "id": "solar",
      "name": "Panneaux solaires",
      "at": [
        0.55,
        -0.01,
        -0.05
      ],
      "more": [
        [
          -0.55,
          -0.01,
          -0.05
        ]
      ],
      "match": "^panel_",
      "reach": 0.06,
      "zoom": 1.6,
      "desc": "Deux panneaux décagonaux de 2,15 m de diamètre, dépliés en éventail après l’atterrissage. Ils donnent à InSight 6 m d’envergure et l’alimentent en électricité."
    },
    {
      "id": "arm",
      "name": "Bras robotisé (IDA)",
      "at": [
        -0.106,
        0.158,
        0.254
      ],
      "match": "^arm_",
      "reach": 0.04,
      "zoom": 1.2,
      "desc": "Bras de 1,8 m à quatre moteurs. Il a soulevé du pont le sismomètre, son bouclier et la sonde de chaleur pour les poser sur le sol martien."
    },
    {
      "id": "idc",
      "name": "Caméra du bras (IDC)",
      "at": [
        -0.165,
        0.28,
        0.353
      ],
      "match": "^(IDC|lens_cap_IDC)",
      "reach": 0.03,
      "zoom": 0.6,
      "desc": "Caméra couleur fixée sur l'avant-bras. Elle photographie les instruments, le sol et le paysage en panorama."
    },
    {
      "id": "shovel",
      "name": "Pelle",
      "at": [
        -0.277,
        0.204,
        0.438
      ],
      "match": "^shovel",
      "reach": 0.03,
      "zoom": 0.6,
      "desc": "Petite pelle au bout du bras. Elle a servi à tasser et à ramener du sol sur la sonde de chaleur, puis sur le câble du sismomètre."
    },
    {
      "id": "grapple",
      "name": "Grappin",
      "at": [
        -0.277,
        0.134,
        0.449
      ],
      "match": "^(grapple|claw_)",
      "reach": 0.03,
      "zoom": 0.6,
      "desc": "Pince à cinq doigts au bout d'un câble. Elle saisit chaque instrument par sa poignée pour le soulever du pont et le poser au sol."
    },
    {
      "id": "icc",
      "name": "Caméra de contexte (ICC)",
      "at": [
        -0.145,
        -0.06,
        0.197
      ],
      "match": "^(ICC|lens_cap_ICC)",
      "reach": 0.03,
      "zoom": 0.6,
      "desc": "Caméra grand angle fixée sous le pont. Elle surveille en permanence la zone où les instruments sont déposés."
    },
    {
      "id": "twins",
      "name": "Capteurs TWINS",
      "at": [
        -0.145,
        0.044,
        0.042
      ],
      "more": [
        [
          0.152,
          0.048,
          0.01
        ]
      ],
      "match": "^TWINS",
      "reach": 0.03,
      "zoom": 0.7,
      "desc": "Deux petits mâts opposés qui mesurent la température et le vent. Ils servent à retirer le bruit du vent des mesures du sismomètre."
    },
    {
      "id": "rise",
      "name": "Antennes RISE",
      "at": [
        0.163,
        0.029,
        0.038
      ],
      "more": [
        [
          -0.18,
          0.024,
          0.002
        ]
      ],
      "match": "^RISE",
      "reach": 0.03,
      "zoom": 0.7,
      "desc": "Deux cornets en bande X. En suivant très précisément leur signal depuis la Terre, on mesure l'oscillation de l'axe de Mars, donc la taille de son noyau."
    },
    {
      "id": "uhf",
      "name": "Antenne UHF",
      "at": [
        0.125,
        0.063,
        0.131
      ],
      "match": "^UHF",
      "reach": 0.035,
      "zoom": 0.7,
      "desc": "Antenne hélicoïdale qui envoie les données vers les orbiteurs martiens, relais vers la Terre."
    },
    {
      "id": "wts",
      "name": "Bouclier vent et chaleur (WTS)",
      "at": [
        0.092,
        0.059,
        -0.041
      ],
      "match": "^WTS",
      "reach": 0.05,
      "zoom": 0.8,
      "desc": "Cloche que le bras a posée par-dessus le sismomètre. Elle le protège du vent et des écarts de température, qui fausseraient ses mesures."
    },
    {
      "id": "seis",
      "name": "Sismomètre SEIS",
      "at": [
        0.031,
        0.069,
        0.128
      ],
      "match": "^SEIS",
      "reach": 0.04,
      "zoom": 0.7,
      "desc": "Sismomètre français (CNES) ultrasensible : il détecte des mouvements du sol plus petits qu’un atome. Il a enregistré plus de 1 300 séismes martiens."
    },
    {
      "id": "hp3",
      "name": "Sonde de chaleur HP3",
      "at": [
        -0.078,
        0.073,
        -0.007
      ],
      "match": "^HP3",
      "reach": 0.04,
      "zoom": 0.8,
      "desc": "Sa « taupe » devait s’enfoncer à 5 m pour mesurer la chaleur qui s’échappe de Mars. Le sol trop peu adhérent l’a bloquée à environ 40 cm."
    },
    {
      "id": "tether",
      "name": "Câbles plats (tethers)",
      "at": [
        -0.046,
        0.004,
        0.226
      ],
      "more": [
        [
          -0.068,
          -0.058,
          0.287
        ]
      ],
      "match": "^cable_0[12]",
      "reach": 0.03,
      "zoom": 0.8,
      "desc": "Rubans souples qui relient chaque instrument posé au sol à l’atterrisseur, pour l’énergie et les données."
    },
    {
      "id": "deck",
      "name": "Pont et corps",
      "at": [
        0.079,
        -0.001,
        0.144
      ],
      "more": [
        [
          -0.118,
          0,
          0.035
        ]
      ],
      "match": "^deck$",
      "reach": 0.05,
      "zoom": 1.1,
      "desc": "Plateau d’environ 1,5 m qui portait les instruments pendant le voyage. Dessous, le corps isolé abrite l’ordinateur, les batteries et l’électronique."
    },
    {
      "id": "body",
      "name": "Réservoirs d’hydrazine",
      "at": [
        0.124,
        -0.074,
        0.22
      ],
      "reach": 0.05,
      "zoom": 0.9,
      "desc": "Sous le pont, des réservoirs sphériques contenaient l’hydrazine qui alimentait les moteurs de descente."
    },
    {
      "id": "engines",
      "name": "Propulseurs de descente",
      "at": [
        0.138,
        -0.143,
        0.098
      ],
      "reach": 0.04,
      "zoom": 0.8,
      "desc": "Douze moteurs-fusées pulsés ont freiné l’atterrisseur pendant les dernières secondes de la descente."
    },
    {
      "id": "legs",
      "name": "Jambes",
      "at": [
        0.291,
        -0.278,
        0.166
      ],
      "match": "^leg_",
      "reach": 0.05,
      "zoom": 1.1,
      "desc": "Trois jambes à amortisseur, héritées de l’atterrisseur Phoenix, ont encaissé le contact avec le sol."
    }
  ]
};
