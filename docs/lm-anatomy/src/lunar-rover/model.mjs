// Lunar Roving Vehicle (LRV-3, Apollo 17): the true numbers behind the figure.
// Sources: NASA LRV Operations Handbook (Boeing, 1971), Apollo 17 Mission Report (JSC-07904), NSSDCA.
export const MODEL = {
  unitsPerMetre: 40,
  wheelbase: 2.29, // m
  track: 1.83, // m
  wheelDiameter: 0.818, // m
  wheelWidth: 0.23,
  turningRadius: 3.1, // m, outside wheel
  cruise: 10, // km/h, a typical traverse speed (13 km/h was the design top speed)
  topSpeed: 13,
  motorPower: 190, // W per wheel (0.25 hp)
  battery: { volts: 36, ampHours: 121, count: 2 },
  mass: 210, // kg empty
  payload: 490, // kg
  apollo17Km: 35.9,
};

export const PARTS = [
  { id: "chassis", fr: { name: "Châssis pliable", say: "3 sections d'aluminium · replié contre le module lunaire pendant le vol" }, en: { name: "Folding chassis", say: "3 aluminium sections · folded against the lunar module in flight" } },
  { id: "wheels", fr: { name: "Roues en maille", say: "Ø 82 cm · corde à piano zinguée · chevrons de titane" }, en: { name: "Wire-mesh wheels", say: "82 cm across · zinc-coated piano wire · titanium chevrons" } },
  { id: "motors", fr: { name: "Moteurs de roue", say: "un moteur de 190 W dans chaque moyeu · 13 km/h au maximum" }, en: { name: "Wheel motors", say: "a 190 W motor inside every hub · 13 km/h top speed" } },
  { id: "steer", fr: { name: "Direction aux 4 roues", say: "l'avant et l'arrière braquent ensemble · rayon de braquage de 3,1 m" }, en: { name: "Four-wheel steering", say: "front and rear steer together · 3.1 m turning radius" } },
  { id: "suspension", fr: { name: "Suspension", say: "doubles bras et barres de torsion · 36 cm de garde au sol" }, en: { name: "Suspension", say: "double arms and torsion bars · 36 cm ground clearance" } },
  { id: "fenders", fr: { name: "Garde-boue", say: "Apollo 17 : réparé avec 4 cartes plastifiées et du ruban adhésif" }, en: { name: "Fenders", say: "Apollo 17: repaired with 4 laminated maps and tape" } },
  { id: "seats", fr: { name: "Sièges", say: "pliants, en sangles de nylon · ceintures de sécurité" }, en: { name: "Seats", say: "folding, nylon webbing · seat belts" } },
  { id: "console", fr: { name: "Console et manche", say: "cap, distance, retour au module · un manche en T pour conduire" }, en: { name: "Console and hand controller", say: "heading, distance, range to the LM · a T-handle to drive" } },
  { id: "batteries", fr: { name: "Batteries", say: "2 × 36 V argent-zinc · 121 Ah chacune" }, en: { name: "Batteries", say: "2 × 36 V silver-zinc · 121 Ah each" } },
  { id: "comms", fr: { name: "LCRU et antennes", say: "liaison directe avec la Terre · antenne grand gain en parapluie" }, en: { name: "LCRU and antennas", say: "direct link to Earth · umbrella high-gain antenna" } },
  { id: "camera", fr: { name: "Caméra TV", say: "pilotée depuis Houston · a filmé le décollage d'Apollo 17" }, en: { name: "TV camera", say: "steered from Houston · filmed Apollo 17's liftoff" } },
  { id: "pallet", fr: { name: "Porte-outils", say: "pinces, râteau, pelle · sacs d'échantillons" }, en: { name: "Tool pallet", say: "tongs, rake, scoop · sample bags" } },
];

export const TEXT = {
  fr: {
    title: "Rover lunaire LRV · Apollo 17",
    rest: "garé · vallée de Taurus-Littrow",
    drive: "Rouler",
    stop: "S'arrêter",
    hint3d: "Glissez pour tourner · survolez une pièce · R pour rouler",
    aria3d: "Rover lunaire d'Apollo 17 sur un plateau tournant. Glisser ou flèches gauche/droite : tourner à 360°. Flèches haut/bas : parcourir les pièces. R ou Espace : rouler ou s'arrêter.",
    label: "Le rover lunaire d'Apollo 17 sur un socle de régolithe : un châssis pliable en trois sections, quatre roues en maille métallique sous leurs garde-boue, deux sièges en sangles, la console et le manche en T ; à l'avant les batteries, le boîtier de communication, l'antenne parapluie et la caméra de télévision ; à l'arrière le porte-outils.",
    caption: "Trois rovers lunaires sont restés sur la Lune, ceux d'Apollo 15, 16 et 17. Chaque roue a son propre moteur de 190 W, et les deux essieux braquent en sens inverse : le rover tourne ici à son rayon minimal de 3,1 m. Celui d'Apollo 17 a parcouru 35,9 km en trois sorties. Garé à environ 145 m du module lunaire, sa caméra pilotée depuis Houston a filmé le décollage de Challenger le 14 décembre 1972.",
    driving: "roule",
    stopping: "freine",
    phases: { drive: "le rover roule", stop: "le rover est garé" },
  },
  en: {
    title: "Lunar Roving Vehicle · Apollo 17",
    rest: "parked · Taurus-Littrow valley",
    drive: "Drive",
    stop: "Stop",
    hint3d: "Drag to turn · hover a part · R to drive",
    aria3d: "Apollo 17 Lunar Roving Vehicle on a turntable. Drag or left/right arrows: turn through 360°. Up/down arrows: step through the parts. R or Space: drive or stop.",
    label: "Apollo 17's Lunar Roving Vehicle on a regolith base: a three-section folding chassis, four wire-mesh wheels under their fenders, two webbing seats, the console and T-handle; at the front the batteries, the communications box, the umbrella antenna and the TV camera; at the back the tool pallet.",
    caption: "Three lunar rovers were left on the Moon, from Apollo 15, 16 and 17. Every wheel has its own 190 W motor, and both axles steer, in opposite directions: here the rover turns at its 3.1 m minimum radius. Apollo 17's rover covered 35.9 km in three moonwalks. Parked about 145 m from the lunar module, its camera, steered from Houston, filmed Challenger's liftoff on 14 December 1972.",
    driving: "driving",
    stopping: "braking",
    phases: { drive: "the rover is driving", stop: "the rover is parked" },
  },
};
