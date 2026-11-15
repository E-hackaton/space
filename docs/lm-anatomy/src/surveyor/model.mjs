// Surveyor 3 (1967): the true numbers behind the figure.
// Sources: Surveyor III Mission Report (JPL TR 32-1177), Apollo 12 Mission Report, NSSDCA 1967-035A.
export const MODEL = {
  unitsPerMetre: 40,
  height: 3.0, // m
  span: 4.3, // m across the footpads
  landedMass: 302, // kg (dry, after the retro rocket was jettisoned)
  verniers: { count: 3, min: 133, max: 463 }, // N each, throttleable
  solarCells: 3960,
  solarWatts: 85,
  pictures: 6315,
  sampler: { reach: 1.5, scoopWidth: 0.05, scoopLength: 0.12, trenchDepth: 0.175 }, // m
  apollo12: { distance: 183, date: "1969-11-20", months: 31 }, // m from Intrepid, months on the Moon before the visit
  landed: "1967-04-20",
};

export const PARTS = [
  { id: "frame", fr: { name: "Châssis en treillis", say: "tubes d'aluminium en trépied · porte tout le reste" }, en: { name: "Tubular frame", say: "aluminium tubes in a tripod · carries everything else" } },
  { id: "legs", fr: { name: "Jambes et patins", say: "3 jambes à amortisseur · patins en nid d'abeille écrasable" }, en: { name: "Legs and footpads", say: "3 shock-absorbing legs · crushable honeycomb footpads" } },
  { id: "verniers", fr: { name: "Moteurs verniers", say: "3 moteurs réglables de 133 à 463 N · ont fait rebondir la sonde deux fois" }, en: { name: "Vernier engines", say: "3 throttleable engines, 133 to 463 N · bounced the probe twice" } },
  { id: "tanks", fr: { name: "Réservoirs", say: "3 de carburant et 3 de comburant pour les verniers" }, en: { name: "Tanks", say: "3 fuel and 3 oxidiser spheres for the verniers" } },
  { id: "retro", fr: { name: "Support du rétrofusée", say: "le moteur à poudre a été largué après le freinage, à 11 km d'altitude" }, en: { name: "Retro-rocket mount", say: "the solid motor was dropped after braking, 11 km up" } },
  { id: "mast", fr: { name: "Mât", say: "porte l'antenne et le panneau solaire, orientés vers la Terre et le Soleil" }, en: { name: "Mast", say: "carries the antenna and the solar panel, aimed at Earth and Sun" } },
  { id: "antenna", fr: { name: "Antenne plane", say: "antenne grand gain · a envoyé les images vers la Terre" }, en: { name: "Planar antenna", say: "high-gain antenna · sent the pictures home" } },
  { id: "solar", fr: { name: "Panneau solaire", say: "3 960 cellules · 85 W" }, en: { name: "Solar panel", say: "3,960 cells · 85 W" } },
  { id: "compartments", fr: { name: "Compartiments thermiques", say: "électronique et batteries, sous des miroirs qui renvoient le Soleil" }, en: { name: "Thermal compartments", say: "electronics and batteries, under mirrors that reject sunlight" } },
  { id: "camera", fr: { name: "Caméra TV", say: "6 315 images · rapportée sur Terre par Apollo 12" }, en: { name: "TV camera", say: "6,315 pictures · brought back to Earth by Apollo 12" } },
  { id: "omni", fr: { name: "Antennes omnidirectionnelles", say: "liaison de secours, quelle que soit l'orientation" }, en: { name: "Omni antennas", say: "backup link, whatever the attitude" } },
  { id: "sampler", fr: { name: "Bras d'échantillonnage", say: "portée 1,5 m · pelle de 5 cm · tranchées de 17,5 cm" }, en: { name: "Surface sampler", say: "1.5 m reach · 5 cm scoop · trenches 17.5 cm deep" } },
];

export const TEXT = {
  fr: {
    title: "Surveyor 3 · 1967",
    rest: "posée · Océan des Tempêtes",
    dig: "Creuser",
    digging: "creuse",
    hint3d: "Glissez pour tourner · D pour creuser · A pour 1969",
    aria3d: "La sonde Surveyor 3 sur un plateau tournant. Glisser ou flèches gauche/droite : tourner à 360°. Flèches haut/bas : parcourir les pièces. D : creuser une tranchée. A : passer de 1967 à 1969 (visite d'Apollo 12).",
    label: "La sonde Surveyor 3 sur un socle de régolithe : un trépied en tubes d'aluminium sur trois jambes à patins, trois moteurs verniers, six réservoirs sphériques, l'anneau vide du rétrofusée ; un mât portant l'antenne plane et le panneau solaire ; deux compartiments thermiques, la caméra à miroir et le bras d'échantillonnage qui creuse une tranchée.",
    caption: "Surveyor 3 s'est posée le 20 avril 1967 dans l'Océan des Tempêtes, après deux rebonds : ses moteurs ne s'étaient pas coupés. Son bras a creusé les premières tranchées du sol lunaire et sa caméra a pris 6 315 images. Deux ans et demi plus tard, Apollo 12 s'est posé à 183 m : Pete Conrad et Alan Bean ont démonté la caméra et la pelle pour les rapporter sur Terre. La sonde est toujours là.",
    year: { 1967: "1967", 1969: "1969 · Apollo 12" },
    phases: { dig: "le bras creuse", rest: "le bras est rangé", y1967: "1967 : la sonde vient d'arriver", y1969: "1969 : Apollo 12 a emporté la caméra et la pelle" },
    reach: "bras",
    trench: "tranchée",
    gone: "caméra et pelle rapportées par Apollo 12",
  },
  en: {
    title: "Surveyor 3 · 1967",
    rest: "landed · Ocean of Storms",
    dig: "Dig",
    digging: "digging",
    hint3d: "Drag to turn · D to dig · A for 1969",
    aria3d: "The Surveyor 3 probe on a turntable. Drag or left/right arrows: turn through 360°. Up/down arrows: step through the parts. D: dig a trench. A: switch between 1967 and 1969 (Apollo 12's visit).",
    label: "The Surveyor 3 probe on a regolith base: a tripod of aluminium tubes on three footpad legs, three vernier engines, six spherical tanks, the empty retro-rocket ring; a mast carrying the planar antenna and solar panel; two thermal compartments, the mirror camera and the surface sampler digging a trench.",
    caption: "Surveyor 3 landed on 20 April 1967 in the Ocean of Storms after two bounces: its engines had not cut off. Its arm dug the first trenches in the lunar soil and its camera took 6,315 pictures. Two and a half years later Apollo 12 landed 183 m away: Pete Conrad and Alan Bean took the camera and the scoop off and brought them back to Earth. The probe is still there.",
    year: { 1967: "1967", 1969: "1969 · Apollo 12" },
    phases: { dig: "the arm is digging", rest: "the arm is stowed", y1967: "1967: the probe has just arrived", y1969: "1969: Apollo 12 took the camera and scoop" },
    reach: "arm",
    trench: "trench",
    gone: "camera and scoop taken home by Apollo 12",
  },
};

// The dig: extend, lower until the scoop meets the ground, drag back, lift and stow. Pure function of time (s).
export const DIG_END = 9;
export function digAt(t, { pivotZ, armLen, scoopDrop, travel }) {
  const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
  const ext = travel * (ease(t / 2) - ease((t - 5) / 2.2));
  const reach = armLen + ext;
  // the pitch at which the scoop's lowest corner just meets the regolith (0.4 units of clearance)
  let lo = -80;
  let hi = 0;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    const r = (mid * Math.PI) / 180;
    if (pivotZ + reach * Math.sin(r) - scoopDrop * Math.cos(r) > 0.4) hi = mid;
    else lo = mid;
  }
  const ground = hi;
  const down = ease((t - 1.6) / 1.4) * (1 - ease((t - 6.6) / 1.6));
  const pitch = 12 + (ground - 12) * down;
  return { ext, pitch, contact: down > 0.999 ? 1 : 0 };
}
