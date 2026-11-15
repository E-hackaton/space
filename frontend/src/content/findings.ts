/*
 * Le fil rouge : « l'ingénierie qui a rendu la science possible ».
 * Pour les pièces clés de chaque machine : ce que la pièce a permis de découvrir ou de réussir.
 * Clé : « <modèle>/<pièce> », le modèle étant celui affiché (NASA, Anatomy, Sojourner, réflecteur).
 * Chaque phrase s'appuie sur la source NASA indiquée ; à relire par l'équipe avec la source à côté.
 */

export interface Finding {
  fr: string;
  en: string;
  /** Nom de la pièce (pour le bloc de fin de récit). */
  partFr: string;
  partEn: string;
  source: string;
}

const MER = 'https://science.nasa.gov/mission/mars-exploration-rovers-spirit-and-opportunity/';
const INSIGHT = 'https://science.nasa.gov/mission/insight/';
const VIKING = 'https://science.nasa.gov/mission/viking-1/';
const INGENUITY = 'https://science.nasa.gov/mission/mars-2020-perseverance/ingenuity-mars-helicopter/';
const PATHFINDER = 'https://science.nasa.gov/mission/mars-pathfinder/';
const SURVEYOR = 'https://science.nasa.gov/mission/surveyor-3/';
const A11 = 'https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-059C';
const A15 = 'https://ntrs.nasa.gov/citations/19720015164';
const CURIOSITY = 'https://science.nasa.gov/mission/msl-curiosity/';
const PERSEVERANCE = 'https://science.nasa.gov/mission/mars-2020-perseverance/';

export const FINDINGS: Record<string, Finding> = {
  // --- Mars ---
  'opportunity/solar': {
    partFr: 'Panneaux solaires', partEn: 'Solar arrays',
    fr: "Des coups de vent ont dépoussiéré ses panneaux plusieurs fois : prévu pour 90 jours, Opportunity a fonctionné plus de 14 ans.",
    en: 'Wind gusts cleaned its panels several times: built for 90 days, Opportunity worked for more than 14 years.',
    source: MER,
  },
  'opportunity/tools': {
    partFr: 'Instruments du bras', partEn: 'Arm instruments',
    fr: "Ils ont étudié de petites billes d'hématite, les « myrtilles » : des indices que de l'eau liquide a autrefois imprégné ce sol.",
    en: 'They studied small hematite spheres, the “blueberries”: clues that liquid water once soaked this ground.',
    source: MER,
  },
  'insight/seis': {
    partFr: 'Sismomètre SEIS', partEn: 'SEIS seismometer',
    fr: "Il a enregistré plus de 1 300 séismes martiens, qui ont permis de mesurer la croûte, le manteau et le noyau de Mars.",
    en: 'It recorded more than 1,300 marsquakes, which let scientists measure Mars’s crust, mantle and core.',
    source: INSIGHT,
  },
  'insight/hp3': {
    partFr: 'Sonde de chaleur HP3', partEn: 'HP3 heat probe',
    fr: "La « taupe » n'a pas réussi à s'enfoncer : le sol martien s'est révélé plus collant que prévu. Une leçon pour les futures foreuses.",
    en: 'The “mole” could not dig in: Martian soil turned out stickier than expected. A lesson for future drills.',
    source: INSIGHT,
  },
  'viking/boom': {
    partFr: 'Bras échantillonneur', partEn: 'Sampler arm',
    fr: "Il a livré du sol aux expériences de biologie : les premières recherches de vie à la surface de Mars, sans preuve convaincante de vie.",
    en: 'It fed soil to the biology experiments: the first search for life on the surface of Mars, with no convincing evidence of life.',
    source: VIKING,
  },
  'viking/meteo': {
    partFr: 'Mât météo', partEn: 'Weather mast',
    fr: 'Il a donné les premières mesures météo prises pendant des années à la surface de Mars.',
    en: 'It gave the first weather measurements taken for years on the surface of Mars.',
    source: VIKING,
  },
  'ingenuity/blades': {
    partFr: 'Pales', partEn: 'Rotor blades',
    fr: "Très longues et très rapides pour mordre dans un air environ 100 fois moins dense que sur Terre : le premier vol motorisé sur une autre planète, le 19 avril 2021.",
    en: 'Very long and very fast to grip air about 100 times thinner than Earth’s: the first powered flight on another planet, on 19 April 2021.',
    source: INGENUITY,
  },
  'sojourner/rocker': {
    partFr: 'Suspension rocker-bogie', partEn: 'Rocker-bogie suspension',
    fr: 'Testée pour la première fois sur Mars par Sojourner, elle a été reprise par Spirit, Opportunity, Curiosity et Perseverance.',
    en: 'First tried on Mars by Sojourner, it was reused by Spirit, Opportunity, Curiosity and Perseverance.',
    source: PATHFINDER,
  },
  'sojourner/apxs': {
    partFr: 'Spectromètre APXS', partEn: 'APXS spectrometer',
    fr: "La première analyse chimique de roches martiennes faite par un rover, au contact de la roche.",
    en: 'The first chemical analysis of Martian rocks made by a rover, right against the rock.',
    source: PATHFINDER,
  },
  'curiosity/parts.arm': {
    partFr: 'Bras et foreuse', partEn: 'Arm and drill',
    fr: "La poudre forée dans les roches du cratère Gale a montré qu'un lac y offrait autrefois des conditions favorables à la vie microbienne.",
    en: 'Powder drilled from Gale crater rocks showed that a lake there once offered conditions suitable for microbial life.',
    source: CURIOSITY,
  },
  'perseverance/parts.arm': {
    partFr: 'Bras et carottier', partEn: 'Arm and coring drill',
    fr: "Il prélève des carottes de roche scellées dans des tubes, mises de côté pour un futur retour d'échantillons vers la Terre.",
    en: 'It takes rock cores sealed in tubes, set aside for a future return of samples to Earth.',
    source: PERSEVERANCE,
  },
  // --- Lune ---
  'surveyor/sampler': {
    partFr: "Bras d'échantillonnage", partEn: 'Surface sampler',
    fr: "Ses tranchées ont montré que le sol lunaire pouvait porter un vaisseau : une étape vers les atterrissages Apollo.",
    en: 'Its trenches showed the lunar soil could bear a spacecraft: a step towards the Apollo landings.',
    source: SURVEYOR,
  },
  'surveyor/camera': {
    partFr: 'Caméra TV', partEn: 'TV camera',
    fr: "Rapportée sur Terre par Apollo 12, elle a permis d'étudier ce que deux ans et demi sur la Lune font à du matériel.",
    en: 'Brought back by Apollo 12, it let engineers study what two and a half years on the Moon do to hardware.',
    source: SURVEYOR,
  },
  'lunar-module/dps': {
    partFr: 'Moteur de descente', partEn: 'Descent engine',
    fr: "Sa poussée réglable a permis à Armstrong de survoler un champ de rochers avant de se poser : sans lui, pas d'échantillons d'Apollo 11.",
    en: 'Its adjustable thrust let Armstrong fly over a boulder field before landing: without it, no Apollo 11 samples.',
    source: A11,
  },
  'lunar-module/ladder': {
    partFr: 'Échelle et plate-forme', partEn: 'Ladder and porch',
    fr: "Le chemin des premiers pas : l'équipage a rapporté 21,5 kg de roches et de sol lunaires.",
    en: 'The path of the first steps: the crew brought back 21.5 kg of lunar rocks and soil.',
    source: A11,
  },
  'lunar-rover/wheels': {
    partFr: 'Roues en maille', partEn: 'Wire-mesh wheels',
    fr: "Elles ont emmené les astronautes bien plus loin qu'à pied : c'est ainsi qu'ils ont trouvé la « Genesis Rock », un fragment de l'ancienne croûte lunaire.",
    en: 'They carried the astronauts much farther than on foot: that is how they found the “Genesis Rock”, a piece of the Moon’s ancient crust.',
    source: A15,
  },
  'reflector/cubes': {
    partFr: 'Coins de cube', partEn: 'Corner cubes',
    fr: "En chronométrant l'aller-retour d'un laser, on a montré que la Lune s'éloigne de la Terre d'environ 3,8 cm par an.",
    en: 'By timing a laser’s round trip, scientists showed that the Moon drifts away from Earth by about 3.8 cm a year.',
    source: 'https://www.jpl.nasa.gov/news/the-apollo-experiment-that-keeps-on-giving/',
  },
};

export const findingOf = (model: string, part: string): Finding | undefined => FINDINGS[`${model}/${part}`];
export const findingsOf = (model: string): Finding[] => Object.entries(FINDINGS).filter(([k]) => k.startsWith(`${model}/`)).map(([, v]) => v);
/** Clés des pièces (dans le modèle) qui ont une découverte associée. */
export const findingPartsOf = (model: string): string[] => Object.keys(FINDINGS).filter((k) => k.startsWith(`${model}/`)).map((k) => k.slice(model.length + 1));
