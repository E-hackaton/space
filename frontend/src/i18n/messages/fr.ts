/**
 * Textes de l'interface en français : la langue de référence.
 *
 * Le dictionnaire anglais (en.ts) doit avoir exactement la même forme : TypeScript le vérifie.
 * Les textes qui contiennent une valeur variable sont des fonctions.
 */

import type { EquipmentKind, EquipmentStatus } from '../../types/api'

export const fr = {
  locale: 'fr-FR',

  common: {
    skipToContent: 'Aller au contenu',
    loading: 'Chargement…',
    appTagline: "Les héros oubliés de l'espace",
    speaker: 'Sankofa',
    newTab: ' (nouvel onglet)',
    language: 'Langue',
    /** Guillemets typographiques propres à chaque langue. */
    quote: (text: string) => `« ${text} »`,
  },

  nav: {
    label: 'Navigation principale',
    atlas: 'Atlas',
    collection: 'Ma collection',
    cardsWon: ' cartes gagnées',
  },

  footer: {
    team: "Projet réalisé par l'équipe G. Bugs (Abidjan) pour le NASA Space Apps Challenge 2026. Ce site n'est ni approuvé ni soutenu par la NASA.",
    data: 'Données et images : NASA (NSSDCA, NASA Science, Scientific Visualization Studio) et USGS. Les sources de chaque héros sont citées sur sa fiche.',
  },

  errors: {
    heroNotFound: "Je ne trouve pas ce héros dans mes archives. Il s'est peut-être perdu dans l'espace !",
    network: "Oups, je n'arrive pas à joindre ma base de données. Vérifie ta connexion et recharge la page.",
  },

  status: {
    labels: {
      active: 'Encore actif',
      useful: 'Encore utile',
      silent: 'Silencieux',
      lost: 'Perdu',
    } satisfies Record<EquipmentStatus, string>,
    descriptions: {
      active: 'Il fonctionne et communique encore avec la Terre.',
      useful: "Il n'envoie plus de signal, mais les scientifiques s'en servent encore.",
      silent: 'Sa mission est terminée. Il ne communique plus, mais on sait où il se trouve.',
      lost: 'Il est trop loin ou trop faible pour être capté.',
    } satisfies Record<EquipmentStatus, string>,
  },

  kinds: {
    lander: 'Atterrisseur',
    descent_stage: 'Étage de descente',
    rover: 'Rover',
    helicopter: 'Hélicoptère',
    instrument: 'Instrument scientifique',
    orbiter: 'Sonde en orbite',
    probe: 'Sonde interplanétaire',
    telescope: 'Télescope spatial',
  } satisfies Record<EquipmentKind, string>,

  home: {
    eyebrow: 'Depuis 1966, ils dorment loin de la Terre',
    title: "Les héros oubliés de l'espace",
    lead: "Des robots, des rovers et des sondes que la NASA a laissés sur la Lune, sur Mars et dans l'espace profond. Leur mission est finie, mais leur histoire ne l'est pas.",
    sankofaIntro:
      "Salut, je suis Sankofa ! Mon nom vient d'un symbole akan qui veut dire : « il n'est pas interdit de retourner chercher ce qu'on a oublié ». Tu savais que des robots dorment sur Mars ? Viens, je te les présente.",
    start: "Commencer l'exploration",
    destinations: 'Choisis ton univers',
    heroesToDiscover: (count: number) => `${count} héros à découvrir`,
  },

  atlas: {
    title: "L'Atlas des héros",
    placesLabel: "Lieux de l'Atlas",
    searching: 'Je cherche les héros…',
    listTitle: 'Tous les héros de ce lieu',
    notLaunched: (year: number) => `Pas encore lancé en ${year}`,
    traveling: (year: number) => `En route en ${year}`,
    viewLabel: 'Type de vue',
    view3d: 'Globe 3D',
    view2d: 'Carte 2D',
    globeLabel: (body: string) => `Globe 3D de ${body}. Fais-le tourner, puis choisis une machine.`,
    globeHint: 'Fais tourner le globe et touche une machine.',
  },

  timeMachine: {
    title: 'Machine à remonter le temps',
    yearShown: 'Année affichée : ',
    play: 'Lancer le voyage dans le temps',
    pause: 'Mettre en pause',
    previous: 'Événement précédent',
    next: 'Événement suivant',
    sliderLabel: (start: number, end: number) => `Choisir une année entre ${start} et ${end}`,
    today: "Aujourd'hui",
    working: (count: number) => `${count} en mission`,
    traveling: (count: number) => `${count} en route`,
    ghosts: (count: number) => `${count} fantôme${count > 1 ? 's' : ''}`,
    quiet: 'Rien de nouveau cette année… Les héros poursuivent leur route.',
    events: { launch: 'Décollage de', arrival: 'Arrivée de', end: 'Fin de mission pour' },
  },

  map: {
    alt: (body: string) => `Carte de ${body}`,
    legend: 'Légende',
    legendWorking: 'En mission',
    legendGhost: 'Fantôme : mission terminée',
    working: 'en mission',
  },

  hero: {
    loading: "J'ouvre les archives…",
    back: "Retour à l'Atlas",
    photoAlt: (name: string) => `Photo de ${name}`,
    collected: '★ Carte dans ta collection',
    imageCredit: 'Image : ',
    facts: {
      launch: 'Lancement',
      arrival: 'Arrivée',
      lastContact: 'Dernier contact',
      missionEnd: 'Fin de mission',
      location: 'Où je repose',
      coordinates: 'Coordonnées',
    },
    story: 'Mon histoire',
    science: "La science que j'ai rendue possible",
    today: 'Ce que je deviens',
    playEyebrow: 'À toi de jouer',
    quizTitle: (name: string) => `Le défi de ${name}`,
    quizIntro: 'Réponds à toutes les questions pour gagner ma carte !',
    sources: 'Mes sources',
  },

  story: {
    chapterOf: (index: number, total: number) => `Chapitre ${index} sur ${total}`,
    listen: 'Écouter',
    stop: 'Arrêter',
    previous: 'Précédent',
    next: 'Suivant',
    challenge: 'Je relève le défi',
  },

  quiz: {
    question: (number: number, text: string) => `Question ${number} : ${text}`,
    right: ' (bonne réponse)',
    wrong: ' (mauvaise réponse)',
    bravo: 'Bravo !',
    tryAgain: "Pas tout à fait… Relis l'histoire et essaie encore !",
    allFound: 'Toutes les réponses sont trouvées : la carte de ce héros rejoint ta collection !',
    progress: (solved: number, total: number) => `${solved} / ${total} réponses trouvées`,
  },

  celebration: {
    title: 'Nouvelle carte débloquée !',
    joined: (name: string) => `${name} rejoint ta collection. Merci de ne pas l'avoir oublié !`,
    seeCollection: 'Voir ma collection',
    continue: 'Continuer',
  },

  collection: {
    title: 'Ma collection',
    rankEyebrow: 'Ton grade',
    cardsLabel: 'Cartes gagnées',
    cards: (count: number, total: number) => `${count} carte${count > 1 ? 's' : ''} sur ${total}`,
    nextRank: (title: string) => ` · Prochain grade : ${title}`,
    locked: 'Réussis son quiz pour débloquer cette carte.',
    messageNone: (total: number) =>
      `Tu n'as encore aucune carte. Il y en a ${total} à gagner : lis l'histoire d'un héros et réussis son défi !`,
    messageAll: (total: number) => `Incroyable : tu as les ${total} cartes ! Grâce à toi, aucun de ces héros ne sera oublié.`,
    messageSome: (count: number, total: number) =>
      `Tu as ${count} carte${count > 1 ? 's' : ''} sur ${total}. Continue l'exploration !`,
    ranks: [
      "Recrue de l'espace",
      'Exploratrice ou explorateur junior',
      'Archiviste des étoiles',
      'Pilote de la mémoire',
      'Gardienne ou gardien de la mémoire',
    ],
  },

  notFound: {
    title: "Perdu dans l'espace",
    text: "Cette page n'existe pas… ou alors elle dérive très loin, comme Pioneer 10 !",
    back: 'Retour à la base',
  },

  maps: {
    moon: 'Carte : NASA / GSFC / Arizona State University, mosaïque couleur LRO (CGI Moon Kit, NASA SVS)',
    mars: 'Carte : NASA / JPL / USGS, mosaïque couleur Viking MDIM 2.1',
  },

  coordinates: { north: 'N', south: 'S', east: 'E', west: 'O' },

  experiences: {
    laser: {
      title: 'Mesure la distance de la Lune',
      intro:
        "Tu es dans un observatoire. Tire une impulsion laser vers mes miroirs et chronomètre son retour : c'est exactement ce que font les scientifiques aujourd'hui.",
      sceneLabel: "La Terre à gauche, la Lune à droite, et l'impulsion laser entre les deux",
      earth: 'Terre',
      moon: 'Lune',
      fire: 'Tirer le laser',
      fireAgain: 'Tirer à nouveau',
      inFlight: "L'impulsion file vers la Lune à 300 000 km par seconde…",
      returned: (seconds: string) => `Retour reçu après ${seconds} secondes !`,
      formula: 'distance = vitesse de la lumière × durée ÷ 2',
      explanation:
        "On divise par 2 parce que la lumière fait l'aller et le retour. Les vrais observatoires mesurent cette durée si précisément qu'ils connaissent la distance à quelques millimètres près.",
      futureLegend: "Et dans le futur ? La Lune s'éloigne d'environ 3,8 cm par an.",
      futureSpans: ['100 ans', '10 000 ans', '1 million d’années'],
      inFuture: (span: string) => `Dans ${span}`,
      futureResult: (distance: string) => `La Lune sera environ ${distance} plus loin qu'aujourd'hui.`,
    },
    ingenuity: {
      title: 'Fais décoller Ingenuity',
      intro: 'Règle la vitesse de mes pales. Arriveras-tu à décoller sur Mars ? Et sur Terre, ce serait plus facile ?',
      where: 'Où veux-tu voler ?',
      planets: { earth: 'Sur Terre', mars: 'Sur Mars' },
      speed: (rpm: string) => `Vitesse des pales : ${rpm} tours par minute`,
      lift: 'Portance (pousse vers le haut)',
      weight: 'Poids (tire vers le bas)',
      takeoff: (planet: string, rpm: string) => `Décollage ! ${planet}, il faut au moins ${rpm} tours par minute.`,
      grounded: 'Encore au sol : la portance est plus faible que le poids. Fais tourner les pales plus vite !',
      note: "Sur Mars, la gravité est plus faible, mais l'air est environ 100 fois moins dense : les pales doivent tourner environ 6 fois plus vite que sur Terre. Modèle simplifié.",
    },
    dust: {
      title: 'Garde Opportunity en vie',
      intro:
        'Mon énergie vient du Soleil, mais la poussière martienne recouvre mes panneaux. Avance dans le temps et vois combien de sols tu tiens.',
      start: 'Sol 0 : Opportunity se réveille dans le cratère Eagle, panneaux propres. Mission prévue : 90 sols.',
      cleaned: (sol: string) => `Sol ${sol} : un tourbillon de vent est passé et a soufflé la poussière ! Énergie retrouvée.`,
      dusty: (sol: string) => `Sol ${sol} : la poussière s'accumule…`,
      lowPower: ' Énergie faible : Opportunity se met en mode économie.',
      storm:
        "Juin 2018 : une tempête de poussière recouvre presque toute la planète. Le ciel devient noir en plein jour. Dans la réalité, le dernier signal d'Opportunity arrive le 10 juin 2018.",
      asleep:
        "Plus de lumière, plus d'énergie : Opportunity s'endort. Pendant des mois, les ingénieurs envoient plus de mille appels. La mission est déclarée terminée le 13 février 2019, après près de 15 ans au lieu de 90 jours.",
      replay: 'Revivre la mission',
      advance: 'Avancer de 100 sols',
      toStorm: 'Arriver en 2018',
      sol: (sol: string) => `Sol ${sol}`,
      energy: 'Énergie',
      energyLabel: 'Énergie des panneaux solaires',
      sceneLabel: (percent: number) => `Opportunity et ses panneaux solaires, couverts de poussière à ${percent} %`,
      note: "Opportunity n'avait pas d'essuie-glace : ce sont des coups de vent martiens qui ont nettoyé ses panneaux, par chance, plusieurs fois. C'est l'une des raisons de sa longévité. Simulation simplifiée.",
    },
  },
}

/** Forme commune à toutes les langues : les valeurs sont des chaînes ou des fonctions de même signature. */
export type Messages = typeof fr
