// Données de l’engin Viking : chiffres, texte et pièces annotées.
// `at` = position dans le modèle normalisé (centré, rayon 1, Y vers le haut).
// Le modèle NASA n'a que deux maillages découpés par matériau (polySurfa1_1…9, polySurfa2_1…3) :
// seuls le bras échantillonneur (polySurfa1_2/3) et l'antenne à faible gain (polySurfa2_2/3) sont isolés,
// les autres pièces reposent sur at/more/reach.
// Son animation intégrée n'a qu'une seule image clé (position de repos) : elle ne fait rien bouger,
// d'où l'absence de bouton d'action et de pièce `toggles`.
export default {
  "id": "viking",
  "file": "04-viking.glb",
  "source": "04-viking.jpeg",
  "page": "https://science.nasa.gov/3d-resources/viking-lander/",
  "title": "Viking",
  "sub": "atterrisseur · NASA, 1976",
  "facts": [
    ["masse au sol", "~600 kg"],
    ["Viking 1", "20 juillet 1976"],
    ["Viking 2", "3 sept. 1976"],
    ["énergie", "2 RTG"]
  ],
  "intro": "Les deux atterrisseurs Viking sont les premiers engins à avoir fonctionné durablement sur Mars. Ils y ont photographié le sol, mesuré la météo et cherché des traces de vie.",
  "view": {
    "az": 35,
    "el": 16,
    "dist": 2.9,
    "target": [-0.025, -0.05, 0.017]
  },
  "r": 0.05,
  "parts": [
    {
      "id": "hga",
      "name": "Antenne grand gain (bande S)",
      "at": [-0.487, 0.291, 0.068],
      "more": [[-0.443, 0.291, 0.088], [-0.453, 0.2, 0.103], [-0.453, 0.12, 0.103]],
      "reach": 0.11,
      "zoom": 1.2,
      "desc": "Parabole orientable de 76 cm pointée vers la Terre : liaison directe, sans relais par l'orbiteur."
    },
    {
      "id": "meteo",
      "name": "Mât et capteurs météo",
      "at": [-0.281, 0.258, -0.48],
      "more": [[-0.257, 0.124, -0.383], [-0.27, 0.19, -0.43], [-0.24, 0.06, -0.34]],
      "reach": 0.07,
      "zoom": 1.1,
      "desc": "Mât déployé après l'atterrissage ; à son extrémité, des capteurs mesurent la température, la vitesse et la direction du vent."
    },
    {
      "id": "cams",
      "name": "Caméras (2)",
      "at": [-0.112, 0.11, -0.123],
      "more": [[0.037, 0.111, 0.184], [0.04, 0.07, 0.18], [-0.1, 0.06, -0.15]],
      "reach": 0.06,
      "zoom": 1,
      "desc": "Deux caméras à balayage : un miroir tournant explore le paysage ligne par ligne, et le couple donne des vues en relief."
    },
    {
      "id": "lga",
      "name": "Antenne à faible gain (bande S)",
      "at": [-0.315, 0.024, 0.321],
      "reach": 0.05,
      "match": "^polySurfa2_[23]$",
      "zoom": 0.8,
      "desc": "Petite antenne omnidirectionnelle : elle reçoit les commandes de la Terre quelle que soit l'orientation de l'atterrisseur."
    },
    {
      "id": "rtg",
      "name": "Capots des générateurs RTG",
      "at": [-0.34, 0.022, 0.043],
      "more": [[-0.266, 0.034, -0.003], [-0.405, 0.023, -0.147], [-0.129, 0.032, 0.308], [-0.202, 0.028, 0.378]],
      "reach": 0.09,
      "zoom": 1.2,
      "desc": "Deux capots pare-vent abritent chacun un générateur au plutonium 238 : de l'électricité, et de la chaleur pour l'électronique."
    },
    {
      "id": "body",
      "name": "Corps de l'atterrisseur",
      "at": [0.057, -0.082, 0.359],
      "more": [[0.035, -0.067, 0.284], [-0.302, -0.053, 0.34], [0.04, -0.168, 0.267], [0.011, -0.178, 0.318], [-0.307, -0.178, 0.34], [0.044, -0.045, 0.3], [0.05, -0.145, -0.011], [-0.485, -0.105, 0.048], [-0.508, -0.051, 0.075]],
      "reach": 0.08,
      "zoom": 1.3,
      "desc": "Caisson hexagonal en aluminium : ordinateur, enregistreurs et laboratoires de biologie, de chimie (GCMS) et d'analyse aux rayons X."
    },
    {
      "id": "tank",
      "name": "Réservoirs d'ergols",
      "at": [0.007, -0.047, 0.513],
      "more": [[-0.545, -0.054, -0.23], [-0.45, -0.06, -0.34], [-0.471, -0.107, -0.341]],
      "reach": 0.12,
      "zoom": 1.1,
      "desc": "Deux réservoirs sphériques d'hydrazine pour la descente finale ; leurs petites tuyères sont les moteurs de roulis."
    },
    {
      "id": "engine",
      "name": "Moteur de descente finale",
      "at": [0.01, -0.13, -0.182],
      "more": [[-0.006, -0.107, -0.225]],
      "reach": 0.06,
      "zoom": 0.9,
      "desc": "Un des trois moteurs d'atterrissage à 18 petites tuyères : le jet étalé ne creuse ni ne pollue le sol à étudier."
    },
    {
      "id": "boom",
      "name": "Bras échantillonneur",
      "at": [0.478, -0.1, 0.029],
      "more": [[0.114, 0.022, 0.096], [0.3, -0.03, 0.06], [0.58, -0.15, 0.02]],
      "reach": 0.07,
      "match": "^polySurfa1_[23]$",
      "zoom": 1.4,
      "desc": "Bras télescopique de près de 3 m : il creuse le sol et livre les échantillons aux laboratoires de bord."
    },
    {
      "id": "head",
      "name": "Tête collectrice",
      "at": [0.694, -0.19, 0.012],
      "more": [[0.719, -0.198, 0.009]],
      "reach": 0.05,
      "zoom": 0.7,
      "desc": "Petite pelle au bout du bras : elle ramasse sol et cailloux, et ses aimants retiennent les grains magnétiques."
    },
    {
      "id": "shock",
      "name": "Jambes et amortisseurs",
      "at": [-0.501, -0.047, 0.297],
      "more": [[-0.505, 0.04, 0.266], [-0.505, -0.14, 0.266], [0.127, 0.022, 0.281], [0.123, -0.1, 0.26], [-0.21, -0.061, -0.307], [-0.21, 0.04, -0.307], [0.226, -0.255, 0.334], [-0.596, -0.257, 0.338], [-0.212, -0.256, -0.411], [0.12, -0.276, 0.347], [0.205, -0.287, 0.255], [-0.575, -0.282, 0.235], [-0.41, -0.221, 0.331], [-0.21, -0.29, -0.36]],
      "reach": 0.08,
      "zoom": 1.2,
      "desc": "Chacune des trois jambes cache un amortisseur en nid d'abeilles d'aluminium qui s'écrase à l'impact pour absorber le choc."
    },
    {
      "id": "foot",
      "name": "Patins",
      "at": [0.24, -0.367, 0.401],
      "more": [[-0.643, -0.362, 0.37], [-0.205, -0.37, -0.48]],
      "reach": 0.12,
      "zoom": 1.2,
      "desc": "Trois larges patins répartissent le poids de l'engin sur le sol martien."
    }
  ]
};
