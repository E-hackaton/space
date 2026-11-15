// Données de l’engin Pioneer 10 : chiffres, texte et pièces annotées.
// `at` = position dans le modèle normalisé (centré, rayon 1, Y vers le haut).
// Nœuds du modèle utiles pour `match` : AO_dish (parabole), AO_rtg (générateurs),
// Norm_silver (panneaux du détecteur de météoroïdes), Pioneer030 (boîtier du
// détecteur d'astéroïdes-météoroïdes). Les autres nœuds mêlent plusieurs pièces.
export default {
  "id": "pioneer",
  "file": "07-pioneer.glb",
  "source": "07-pioneer.jpeg",
  "page": "https://science.nasa.gov/3d-resources/pioneer/",
  "title": "Pioneer 10",
  "sub": "sonde vers Jupiter et au-delà · NASA/Ames",
  "facts": [
    ["masse", "258 kg"],
    ["lancement", "2 mars 1972"],
    ["Jupiter", "3 déc. 1973"],
    ["dernier signal", "23 janv. 2003"]
  ],
  "intro": "Première sonde à traverser la ceinture d'astéroïdes et à survoler Jupiter. Elle file depuis hors du Système solaire, avec sa plaque gravée à l'intention d'éventuels lecteurs.",
  // Vue plongeante : le long mât du magnétomètre (vers le bas) est raccourci et
  // tout l'engin tient dans le cadre, bout du mât compris.
  "view": { "az": 30, "el": 65, "dist": 2.0, "target": [0.03, 0.22, 0] },
  "r": 0.05,
  "parts": [
    {
      "id": "dish",
      "name": "Antenne principale",
      "at": [0.067, 0.752, 0.048],
      "more": [[-0.01, 0.774, 0.042]],
      "reach": 0.06,
      "match": "^AO_dish$",
      "zoom": 1.4,
      "desc": "Parabole de 2,74 m toujours pointée vers la Terre. La sonde tourne sur elle-même (4,8 tours par minute) pour rester stable."
    },
    {
      "id": "mga",
      "name": "Antenne à gain moyen",
      "at": [0.01, 0.58, -0.245],
      "more": [[0.025, 0.562, -0.253], [0.001, 0.568, -0.235]],
      "reach": 0.04,
      "zoom": 0.6,
      "desc": "Cornet monté sur un trépied au foyer de la parabole. Son faisceau plus large aidait à garder le contact quand la sonde n'était pas pointée pile vers la Terre."
    },
    {
      "id": "meteo",
      "name": "Détecteur de météoroïdes",
      "at": [0.188, 0.651, 0.049],
      "more": [[0.155, 0.449, 0.061], [0.125, 0.48, 0.079], [0.187, 0.491, 0.057]],
      "reach": 0.035,
      "match": "^Norm_silver$",
      "zoom": 0.8,
      "desc": "13 panneaux de cellules pressurisées au dos de la parabole. Une poussière qui perce une cellule la fait fuir : chaque fuite compte un impact."
    },
    {
      "id": "rtg",
      "name": "Générateurs RTG",
      "at": [0.44, 0.81, 0.13],
      "more": [[-0.44, 0.79, 0.13]],
      "reach": 0.08,
      "match": "^AO_rtg$",
      "zoom": 0.8,
      "desc": "Quatre générateurs au plutonium 238 (155 W au départ), au bout de deux bras pour éloigner leur rayonnement des instruments. Si loin du Soleil, des panneaux solaires seraient inutiles."
    },
    {
      "id": "mag",
      "name": "Magnétomètre à hélium",
      "at": [0.002, -0.825, 0.11],
      "more": [[0, -0.6, 0.11], [0, -0.35, 0.11], [0, -0.1, 0.11], [0, 0.15, 0.11]],
      "reach": 0.06,
      "zoom": 0.5,
      "desc": "Au bout d'un mât de 6,6 m, loin du magnétisme de la sonde. Il a mesuré le champ magnétique interplanétaire et celui de Jupiter."
    },
    {
      "id": "bus",
      "name": "Compartiment des équipements",
      "at": [-0.007, 0.554, 0.186],
      "more": [[0.068, 0.616, 0.126], [0.07, 0.604, 0.164], [-0.07, 0.557, 0.17], [0.073, 0.53, 0.182]],
      "reach": 0.06,
      "zoom": 0.9,
      "desc": "Caisson hexagonal derrière la parabole : électronique, émetteurs et réservoir d'hydrazine. Des persiennes autour de l'anneau arrière règlent sa température."
    },
    {
      "id": "amd",
      "name": "Détecteur d'astéroïdes-météoroïdes",
      "at": [-0.129, 0.534, 0.155],
      "more": [[-0.132, 0.533, 0.133], [-0.121, 0.52, 0.161]],
      "reach": 0.04,
      "match": "^Pioneer030$",
      "zoom": 0.6,
      "desc": "Quatre petits télescopes qui guettaient la lumière renvoyée par les grains et astéroïdes proches, pour estimer leur taille, leur vitesse et leur trajectoire."
    },
    {
      "id": "sci",
      "name": "Compartiment des instruments",
      "at": [0.079, 0.455, 0.147],
      "more": [[0.024, 0.413, 0.165], [-0.062, 0.419, 0.162], [0.089, 0.449, 0.138], [0.094, 0.416, 0.146], [-0.055, 0.392, 0.088]],
      "reach": 0.045,
      "zoom": 0.7,
      "desc": "Accolé au caisson, il porte la plupart des onze instruments : particules chargées, rayons cosmiques, tubes Geiger, radiations piégées, radiomètre infrarouge, photomètre UV."
    }
  ]
};
