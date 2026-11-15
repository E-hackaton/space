// The true numbers behind the figure. Everything the page prints or moves comes from here.
// Sources: NASA Apollo 11 Press Kit (1969), Apollo 11 Mission Report (MSC-00171), LM News Reference (Grumman).
export const MODEL = {
  unitsPerMetre: 40,
  g: 1.62, // m/s², lunar surface gravity
  g0: 9.80665,
  aps: { thrust: 15570, isp: 311, mass0: 4890, rise: 10 }, // N, s, kg at liftoff, seconds of vertical rise before pitch-over
  dps: { thrust: 45040 },
  rcs: { count: 16, thrust: 445 },
  liftoff: "1969-07-21T17:54:00Z",
  landing: "1969-07-20T20:17:40Z",
  site: "0,674° N · 23,473° E",
};

// Thrust builds in about 0.15 s; mass falls at F / (Isp·g0). Returns altitude (m), speed (m/s), mass (kg) at time t (s).
export function ascentAt(t) {
  const { thrust, isp, mass0 } = MODEL.aps;
  const mdot = thrust / (isp * MODEL.g0);
  let h = 0;
  let v = 0;
  const dt = 1 / 240;
  for (let s = 0; s < t; s += dt) {
    const step = Math.min(dt, t - s);
    const build = Math.min(1, s / 0.15);
    const m = mass0 - mdot * s;
    const a = (thrust * build) / m - MODEL.g;
    v += Math.max(a, h > 0 ? a : 0) * step;
    h += v * step;
  }
  return { h, v, m: mass0 - mdot * t };
}

// The figure's selectable assemblies, in reading order. `rides: "ascent"` leaves with the ascent stage.
export const PARTS = [
  { id: "ascent", rides: "ascent", fr: { name: "Étage de remontée", say: "cabine de 2 astronautes · 4,9 t au décollage" }, en: { name: "Ascent stage", say: "two-crew cabin · 4.9 t at liftoff" } },
  { id: "windows", rides: "ascent", fr: { name: "Hublots et écoutille", say: "2 hublots triangulaires · écoutille carrée de 81 cm" }, en: { name: "Windows and hatch", say: "2 triangular windows · 81 cm square hatch" } },
  { id: "antennas", rides: "ascent", fr: { name: "Antennes", say: "bande S vers la Terre · radar de rendez-vous · VHF · EVA" }, en: { name: "Antennas", say: "S-band to Earth · rendezvous radar · VHF · EVA" } },
  { id: "rcs", rides: "ascent", fr: { name: "Propulseurs RCS", say: "16 petits moteurs de 445 N en 4 blocs · orientation" }, en: { name: "RCS thrusters", say: "16 small 445 N engines in 4 quads · attitude" } },
  { id: "aps", rides: "ascent", fr: { name: "Moteur de remontée", say: "15,6 kN · hypergolique, sans allumeur · caché sous l'étage de remontée" }, en: { name: "Ascent engine", say: "15.6 kN · hypergolic, no igniter · tucked under the ascent stage" } },
  { id: "descent", fr: { name: "Étage de descente", say: "servit de rampe de lancement · resté sur la Lune" }, en: { name: "Descent stage", say: "served as the launch pad · still on the Moon" } },
  { id: "dps", fr: { name: "Moteur de descente", say: "45 kN · premier moteur-fusée à poussée réglable piloté" }, en: { name: "Descent engine", say: "45 kN · first throttleable rocket flown by a crew" } },
  { id: "gear", fr: { name: "Train d'atterrissage", say: "4 jambes à amortisseurs en nid d'abeille · patins de 94 cm" }, en: { name: "Landing gear", say: "4 legs with crushable honeycomb · 94 cm footpads" } },
  { id: "probes", fr: { name: "Sondes de contact", say: "tiges de 1,73 m · allument « Contact light »" }, en: { name: "Contact probes", say: "1.73 m rods · switch on “Contact light”" } },
  { id: "ladder", fr: { name: "Échelle, plate-forme et plaque", say: "9 barreaux · « Ici des hommes de la planète Terre… »" }, en: { name: "Ladder, porch and plaque", say: "9 rungs · “Here men from the planet Earth…”" } },
  { id: "mesa", fr: { name: "MESA et caméra TV", say: "a filmé le premier pas pour 600 millions de spectateurs" }, en: { name: "MESA and TV camera", say: "filmed the first step for 600 million viewers" } },
  { id: "lrrr", fr: { name: "Réflecteur laser", say: "100 coins de cube · toujours visé depuis la Terre" }, en: { name: "Laser retroreflector", say: "100 corner cubes · still ranged from Earth" } },
  { id: "psep", fr: { name: "Sismomètre", say: "panneaux solaires · a écouté la Lune 3 semaines" }, en: { name: "Seismometer", say: "solar panels · listened to the Moon for 3 weeks" } },
  { id: "flag", fr: { name: "Drapeau", say: "renversé par le souffle du décollage" }, en: { name: "Flag", say: "blown over by the ascent engine" } },
];

export const TEXT = {
  fr: {
    title: "Module lunaire Eagle · Apollo 11",
    rest: "posé · base de la Tranquillité",
    liftoff: "Décollage",
    rewind: "Revenir",
    hint: "Survolez une pièce · L pour décoller",
    aria3d: "Module lunaire Eagle d'Apollo 11 sur un plateau tournant. Glisser ou flèches gauche/droite : tourner à 360°. Flèches haut/bas : parcourir les pièces. L ou Espace : décollage. Échap : revenir.",
    hint3d: "Glissez pour tourner · survolez une pièce · L pour décoller",
    aria: "Module lunaire Eagle d'Apollo 11 sur son socle. Flèches : parcourir les pièces. L ou Espace : décollage de l'étage de remontée. Échap : revenir.",
    label: "Le module lunaire Eagle d'Apollo 11 posé sur un socle de régolithe : l'étage de descente doré sur quatre jambes à patins, avec échelle, plate-forme et caméra MESA ; au-dessus, l'étage de remontée à facettes avec ses hublots, ses antennes et ses quatre blocs de propulseurs. Autour : le réflecteur laser, le sismomètre et le drapeau.",
    caption: "Le 21 juillet 1969 à 17 h 54 UTC, le moteur de remontée d'Eagle s'allume : des boulons explosifs libèrent l'étage supérieur, qui utilise l'étage de descente comme rampe de lancement. 15,6 kN pour 4,9 t sous une gravité de 1,62 m/s² : il monte à la verticale pendant 10 s, puis bascule vers l'orbite. L'étage de descente, le réflecteur laser et le sismomètre sont restés là ; le réflecteur renvoie encore aujourd'hui les tirs laser venus de la Terre.",
    left: "étage de descente · sur la Lune depuis 1969",
    rising: "montée verticale",
    pitch: "bascule vers l'orbite",
    returning: "retour",
    phases: { armed: "décollage", left: "l'étage de remontée est parti", rest: "posé" },
    t: (t, h, v) => `T+${t.toFixed(1).replace(".", ",")} s · ${h < 100 ? h.toFixed(1).replace(".", ",") : Math.round(h)} m · ${v.toFixed(1).replace(".", ",")} m/s`,
  },
  en: {
    title: "Lunar Module Eagle · Apollo 11",
    rest: "landed · Tranquility Base",
    liftoff: "Lift off",
    rewind: "Rewind",
    hint: "Hover a part · L to lift off",
    aria3d: "Apollo 11 Lunar Module Eagle on a turntable. Drag or left/right arrows: turn through 360°. Up/down arrows: step through the parts. L or Space: lift off. Escape: rewind.",
    hint3d: "Drag to turn · hover a part · L to lift off",
    aria: "Apollo 11 Lunar Module Eagle on its base. Arrows: step through the parts. L or Space: lift off the ascent stage. Escape: rewind.",
    label: "Apollo 11's Lunar Module Eagle on a regolith base: the gold descent stage on four footpad legs, with ladder, porch and MESA camera; above it the faceted ascent stage with its windows, antennas and four thruster quads. Around it: the laser retroreflector, the seismometer and the flag.",
    caption: "At 17:54 UTC on 21 July 1969 Eagle's ascent engine lit: explosive bolts freed the upper stage, which used the descent stage as its launch pad. 15.6 kN against 4.9 t in 1.62 m/s² gravity: it rose straight up for 10 s, then pitched over toward orbit. The descent stage, the laser retroreflector and the seismometer stayed behind; the reflector still returns laser pulses fired from Earth today.",
    left: "descent stage · on the Moon since 1969",
    rising: "vertical rise",
    pitch: "pitching over toward orbit",
    returning: "rewinding",
    phases: { armed: "liftoff", left: "the ascent stage has gone", rest: "landed" },
    t: (t, h, v) => `T+${t.toFixed(1)} s · ${h < 100 ? h.toFixed(1) : Math.round(h)} m · ${v.toFixed(1)} m/s`,
  },
};
