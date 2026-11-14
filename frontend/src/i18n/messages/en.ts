/** Textes de l'interface en anglais. Le type `Messages` garantit qu'aucune clé ne manque. */

import type { Messages } from './fr'

export const en: Messages = {
  locale: 'en-GB',

  common: {
    skipToContent: 'Skip to content',
    loading: 'Loading…',
    appTagline: 'The forgotten heroes of space',
    speaker: 'Sankofa',
    newTab: ' (new tab)',
    language: 'Language',
    quote: (text: string) => `“${text}”`,
  },

  nav: {
    label: 'Main navigation',
    atlas: 'Atlas',
    collection: 'My collection',
    cardsWon: ' cards won',
  },

  footer: {
    team: 'Built by team G. Bugs (Abidjan) for the 2026 NASA Space Apps Challenge. This site is not endorsed or sponsored by NASA.',
    data: "Data and images: NASA (NSSDCA, NASA Science, Scientific Visualization Studio) and USGS. Each hero's sources are listed on its page.",
  },

  errors: {
    heroNotFound: "I can't find this hero in my archives. Maybe it got lost in space!",
    network: "Oops, I can't reach my database. Check your connection and reload the page.",
  },

  status: {
    labels: {
      active: 'Still active',
      useful: 'Still useful',
      silent: 'Silent',
      lost: 'Lost',
    },
    descriptions: {
      active: 'It still works and talks to Earth.',
      useful: 'It no longer sends a signal, but scientists still use it.',
      silent: 'Its mission is over. It no longer communicates, but we know where it is.',
      lost: 'It is too far or too faint to be heard.',
    },
  },

  kinds: {
    lander: 'Lander',
    descent_stage: 'Descent stage',
    rover: 'Rover',
    helicopter: 'Helicopter',
    instrument: 'Science instrument',
    orbiter: 'Orbiter',
    probe: 'Interplanetary probe',
    telescope: 'Space telescope',
  },

  home: {
    eyebrow: 'Sleeping far from Earth since 1966',
    title: 'The forgotten heroes of space',
    lead: 'Robots, rovers and probes that NASA left on the Moon, on Mars and in deep space. Their mission is over, but their story is not.',
    sankofaIntro:
      "Hi, I'm Sankofa! My name comes from an Akan symbol meaning: \"it is not wrong to go back for what you forgot\". Did you know robots are sleeping on Mars? Come, let me introduce you.",
    start: 'Start exploring',
    destinations: 'Choose your world',
    heroesToDiscover: (count: number) => `${count} heroes to discover`,
  },

  atlas: {
    title: 'The Heroes Atlas',
    placesLabel: 'Atlas places',
    searching: 'Looking for the heroes…',
    listTitle: 'All the heroes here',
    notLaunched: (year: number) => `Not launched yet in ${year}`,
    traveling: (year: number) => `On its way in ${year}`,
    viewLabel: 'View type',
    view3d: '3D globe',
    view2d: '2D map',
    globeLabel: (body: string) => `3D globe of ${body}. Spin it, then pick a machine.`,
    globeHint: 'Spin the globe and tap a machine.',
  },

  timeMachine: {
    title: 'Time machine',
    yearShown: 'Year shown: ',
    play: 'Start time travel',
    pause: 'Pause',
    previous: 'Previous event',
    next: 'Next event',
    sliderLabel: (start: number, end: number) => `Pick a year between ${start} and ${end}`,
    today: 'Today',
    working: (count: number) => `${count} on a mission`,
    traveling: (count: number) => `${count} on the way`,
    ghosts: (count: number) => `${count} ghost${count === 1 ? '' : 's'}`,
    quiet: 'Nothing new this year… The heroes carry on.',
    events: { launch: 'Launch of', arrival: 'Arrival of', end: 'End of mission for' },
  },

  map: {
    alt: (body: string) => `Map of ${body}`,
    legend: 'Legend',
    legendWorking: 'On a mission',
    legendGhost: 'Ghost: mission over',
    working: 'on a mission',
  },

  hero: {
    loading: 'Opening the archives…',
    back: 'Back to the Atlas',
    photoAlt: (name: string) => `Photo of ${name}`,
    collected: '★ Card in your collection',
    imageCredit: 'Image: ',
    facts: {
      launch: 'Launch',
      arrival: 'Arrival',
      lastContact: 'Last contact',
      missionEnd: 'End of mission',
      location: 'Where I rest',
      coordinates: 'Coordinates',
    },
    story: 'My story',
    science: 'The science I made possible',
    today: 'What became of me',
    playEyebrow: 'Your turn',
    quizTitle: (name: string) => `${name}'s challenge`,
    quizIntro: 'Answer every question to win my card!',
    sources: 'My sources',
  },

  story: {
    chapterOf: (index: number, total: number) => `Step ${index} of ${total}`,
    listen: 'Listen',
    stop: 'Stop',
    previous: 'Previous',
    next: 'Next',
    challenge: 'Take the challenge',
    guidedTour: 'Guided tour',
    pauseTour: 'Pause',
    timeline: 'Mission timeline',
    undated: 'Today',
    stageLabel: (name: string) => `3D model of ${name}. Spin it to take a closer look.`,
  },

  quiz: {
    question: (number: number, text: string) => `Question ${number}: ${text}`,
    right: ' (right answer)',
    wrong: ' (wrong answer)',
    bravo: 'Well done!',
    tryAgain: 'Not quite… Read the story again and have another go!',
    allFound: "All answers found: this hero's card joins your collection!",
    progress: (solved: number, total: number) => `${solved} / ${total} answers found`,
  },

  celebration: {
    title: 'New card unlocked!',
    joined: (name: string) => `${name} joins your collection. Thank you for not forgetting it!`,
    seeCollection: 'See my collection',
    continue: 'Continue',
  },

  collection: {
    title: 'My collection',
    rankEyebrow: 'Your rank',
    cardsLabel: 'Cards won',
    cards: (count: number, total: number) => `${count} card${count === 1 ? '' : 's'} of ${total}`,
    nextRank: (title: string) => ` · Next rank: ${title}`,
    locked: 'Beat its quiz to unlock this card.',
    messageNone: (total: number) => `You don't have any cards yet. There are ${total} to win: read a hero's story and beat its challenge!`,
    messageAll: (total: number) => `Amazing: you have all ${total} cards! Thanks to you, none of these heroes will be forgotten.`,
    messageSome: (count: number, total: number) =>
      `You have ${count} card${count === 1 ? '' : 's'} out of ${total}. Keep exploring!`,
    ranks: ['Space recruit', 'Junior explorer', 'Star archivist', 'Memory pilot', 'Guardian of memory'],
  },

  notFound: {
    title: 'Lost in space',
    text: "This page doesn't exist… or it's drifting very far away, like Pioneer 10!",
    back: 'Back to base',
  },

  maps: {
    moon: 'Map: NASA / GSFC / Arizona State University, LRO colour mosaic (CGI Moon Kit, NASA SVS)',
    mars: 'Map: NASA / JPL / USGS, Viking MDIM 2.1 colour mosaic',
  },

  coordinates: { north: 'N', south: 'S', east: 'E', west: 'W' },

  experiences: {
    laser: {
      title: "Measure the Moon's distance",
      intro:
        "You are in an observatory. Fire a laser pulse at my mirrors and time how long it takes to come back: that's exactly what scientists do today.",
      sceneLabel: 'Earth on the left, the Moon on the right, and the laser pulse between them',
      earth: 'Earth',
      moon: 'Moon',
      fire: 'Fire the laser',
      fireAgain: 'Fire again',
      inFlight: 'The pulse is racing toward the Moon at 300,000 km per second…',
      returned: (seconds: string) => `Echo received after ${seconds} seconds!`,
      formula: 'distance = speed of light × time ÷ 2',
      explanation:
        'We divide by 2 because the light goes there and back. Real observatories time this so precisely that they know the distance to within a few millimetres.',
      futureLegend: 'And in the future? The Moon drifts away by about 3.8 cm per year.',
      futureSpans: ['100 years', '10,000 years', '1 million years'],
      inFuture: (span: string) => `In ${span}`,
      futureResult: (distance: string) => `The Moon will be about ${distance} farther away than today.`,
    },
    ingenuity: {
      title: 'Make Ingenuity take off',
      intro: 'Set the speed of my blades. Can you take off on Mars? And would it be easier on Earth?',
      where: 'Where do you want to fly?',
      planets: { earth: 'On Earth', mars: 'On Mars' },
      speed: (rpm: string) => `Blade speed: ${rpm} revolutions per minute`,
      lift: 'Lift (pushes up)',
      weight: 'Weight (pulls down)',
      takeoff: (planet: string, rpm: string) => `Lift-off! ${planet}, you need at least ${rpm} revolutions per minute.`,
      grounded: 'Still on the ground: lift is weaker than weight. Spin the blades faster!',
      note: 'On Mars, gravity is weaker, but the air is about 100 times thinner: the blades must spin about 6 times faster than on Earth. Simplified model.',
    },
    dust: {
      title: 'Keep Opportunity alive',
      intro: 'My energy comes from the Sun, but Martian dust covers my panels. Move forward in time and see how many sols you last.',
      start: 'Sol 0: Opportunity wakes up in Eagle crater with clean panels. Planned mission: 90 sols.',
      cleaned: (sol: string) => `Sol ${sol}: a gust of wind blew the dust away! Energy restored.`,
      dusty: (sol: string) => `Sol ${sol}: dust is building up…`,
      lowPower: ' Low power: Opportunity switches to saving mode.',
      storm:
        "June 2018: a dust storm covers almost the whole planet. The sky turns black in broad daylight. In reality, Opportunity's last signal arrives on 10 June 2018.",
      asleep:
        'No light, no energy: Opportunity falls asleep. For months, engineers send more than a thousand calls. The mission is declared over on 13 February 2019, after almost 15 years instead of 90 days.',
      replay: 'Relive the mission',
      advance: 'Move forward 100 sols',
      toStorm: 'Jump to 2018',
      sol: (sol: string) => `Sol ${sol}`,
      energy: 'Energy',
      energyLabel: 'Solar panel energy',
      sceneLabel: (percent: number) => `Opportunity and its solar panels, ${percent}% covered in dust`,
      note: 'Opportunity had no wipers: Martian gusts of wind cleaned its panels, by luck, several times. That is one of the reasons it lasted so long. Simplified simulation.',
    },
  },
}
