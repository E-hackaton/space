# Les Veilleurs du Système solaire

Brief de projet pour Claude Code. Lis ce fichier en entier avant toute tâche.

## 1. Contexte

Projet pour le **NASA Space Apps Challenge 2026**, défi **« Abandonné mais pas oublié : récit sur l'équipement laissé par la NASA sur la Lune et Mars »**.

Le défi demande un outil éducatif ou un récit qui fait découvrir à des jeunes d'âge scolaire et au grand public le matériel laissé par la NASA sur la Lune, sur Mars et dans l'espace lointain : ce que sont ces machines, pourquoi elles ont été envoyées, et ce qu'elles ont permis de découvrir. Le défi insiste sur trois points : **raconter plutôt qu'énumérer**, **relier l'ingénierie aux découvertes scientifiques**, et **l'exactitude des faits**.

Le jury note cinq critères. Chaque choix technique doit servir au moins l'un d'eux :

| Critère | Ce que ça implique pour le code |
|---|---|
| Impact | Fonctionne sur PC modestes, téléphones et connexions lentes ; français et anglais |
| Créativité | Parcours narratif, robots-personnages, mini-jeux scientifiques |
| Validité | Chaque fait a une source NASA ; page « Sources » visible |
| Pertinence | Uniquement du matériel NASA laissé sur la Lune, Mars ou dans l'espace lointain |
| Présentation | Un mode démo fluide de 2 à 3 minutes pour le jury |

## 2. Le concept

Public cible : **tous les curieux de l'espace** : collégiens et lycéens, étudiants, et grand public. Pas seulement des enfants.

Conséquence : le récit principal reste accessible sans aucun prérequis (phrases claires, termes techniques expliqués), et chaque histoire propose une couche **« Pour aller plus loin »** dépliable (chiffres détaillés, instruments, explication scientifique, liens vers les sources) pour les lecteurs qui veulent approfondir.

Chaque machine est un **personnage qui raconte sa propre vie à la première personne** : lancement, voyage, travail, découvertes, et comment sa mission s'est terminée. Fil rouge : chaque robot a ses **« constantes vitales »** (énergie, température, contact radio, poussière sur les panneaux), qui baissent au fil du récit. Le lecteur comprend *pourquoi* le robot s'est endormi.

Deux états visuels, toujours accompagnés d'une icône et d'un texte (jamais la couleur seule) :
- **Actif** : vert (#4BE08A sur fond sombre), lumière qui pulse.
- **Endormi** : ambre (#E0A458 sur fond sombre), lumière fixe.

Chaque histoire se termine par **« Ce que ça a changé sur Terre »** : c'est notre argument d'impact.

## 3. Le parcours spatial (structure narrative)

Le site est un **voyage en chapitres**, du plus proche au plus lointain. L'utilisateur peut suivre le parcours guidé ou explorer librement depuis la carte.

1. **Prologue, la Terre** : écran « Commencer le voyage » (ce clic débloque aussi l'audio). Zoom cinématique depuis la Terre.
2. **Chapitre 1, la Lune** : globe 3D, les six sites Apollo (réflecteurs laser, rovers lunaires, télescope ultraviolet, Surveyor 3).
3. **Chapitre 2, Mars** : globe 3D, Viking 1 et 2, Sojourner, Spirit, Opportunity, Phoenix, InSight, Ingenuity. Curiosity et Perseverance apparaissent en contraste comme « ceux qui travaillent encore ».
4. **Chapitre 3, l'espace lointain** : vue du système solaire, Pioneer 10 et 11 (silencieuses), Voyager 1 et 2 (toujours en contact), New Horizons (active).
5. **Épilogue** : le carnet d'explorateur complété, et une question ouverte sur la responsabilité : que fait l'humanité de ce qu'elle laisse dans l'espace, y compris les débris autour de la Terre ?

Transitions entre chapitres : un vol de caméra en 3D (pas un simple changement de page).

## 4. Écrans

- **Accueil** : la Terre en 3D, titre, bouton « Commencer le voyage », choix de langue.
- **Carte du système solaire** : hub de navigation, chapitres débloqués ou non.
- **Globe d'un chapitre** (3D) : rotation à la souris ou au doigt, marqueurs cliquables aux vraies coordonnées, étiquettes HTML projetées, liste accessible des sites à côté.
- **Histoire d'une machine** (2D) : panneaux style bande dessinée animés au scroll, narration audio avec sous-titres, constantes vitales animées, frise chronologique, photo réelle NASA (images LRO ou HiRISE quand elles existent), voisins, impact sur Terre, « Pour aller plus loin », sources.
- **Mini-jeux** : voir section 6.
- **Carnet d'explorateur** : badges, quiz réussis, machines découvertes.
- **Sources** : toutes les références, groupées par machine.
- **Mode démo jury** : visite automatique de 2 à 3 minutes (Terre, tir laser sur la Lune, Opportunity, Voyager), avec narration.

Un prototype existe déjà : `reference/veilleurs-de-la-lune.html` (globe lunaire en Three.js pur, six sites Apollo, tir laser Terre-Lune en temps réel ~2,5 s). Il sert de **référence visuelle et de contenu** pour le chapitre 1 : porter sa logique (conversion latitude/longitude vers 3D, rotation pour mettre un site face caméra, étiquettes projetées, animation du laser) vers React Three Fiber.

## 5. Stack technique

| Besoin | Choix | Remarque |
|---|---|---|
| Base | **React 18 + TypeScript + Vite** | |
| 3D | **@react-three/fiber** + **@react-three/drei** | drei pour `useGLTF`, `Html`, `Stars`, `CameraControls`, `AdaptiveDpr`, `PerformanceMonitor`, `PositionalAudio` |
| Physique 3D (mini-jeux) | **@react-three/rapier** | Chute marteau/plume, conduite de rover |
| Effets 3D | **@react-three/postprocessing** | Bloom léger sur les marqueurs actifs et le laser, désactivé en mode léger |
| Animations 2D et transitions | **GSAP** (avec ScrollTrigger) pour le scroll narratif et les vols de caméra ; **Motion** (Framer Motion) pour l'interface | |
| Mini-jeux 2D | **PixiJS** via **@pixi/react** | Seulement pour les mini-jeux 2D |
| Audio | **Howler.js** | Musique, effets, narration ; sprites audio |
| État global | **Zustand** (avec `persist`) | Progression, badges, réglages, langue |
| Langues | **react-i18next** | Français par défaut, anglais |
| Navigation | **React Router** | |
| Style | **Tailwind CSS** | Thème clair et sombre pour l'interface ; la scène spatiale reste toujours sombre |
| Hors ligne (bonus) | **vite-plugin-pwa** | Utile pour les écoles à connexion faible |

Avant d'ajouter une dépendance qui n'est pas dans ce tableau, demande-moi.

## 6. Mini-jeux (gamification)

Chaque mini-jeu illustre une **vraie expérience ou une vraie contrainte** de mission :

1. **Le tir laser** (Lune) : envoyer un laser sur un réflecteur Apollo, chronométrer l'aller-retour (~2,5 s), en déduire la distance Terre-Lune (~384 000 km).
2. **Le marteau et la plume** (Lune, Rapier) : reproduire l'expérience de David Scott (Apollo 15). Bouton pour basculer entre la Terre (avec air) et la Lune (sans air). Sur Terre, simuler la résistance de l'air avec un fort `linearDamping` sur la plume.
3. **Pilote d'Ingenuity** (Mars, 2D ou 3D) : faire décoller l'hélicoptère dans un air très peu dense ; il faut tourner les pales bien plus vite que sur Terre.
4. **Nettoyer les panneaux** (Mars, 2D) : la poussière couvre les panneaux d'un rover ; un coup de vent les nettoie, une tempête les recouvre. Montre ce qui est arrivé à Opportunity.
5. **Le message de Voyager** (espace lointain) : envoyer un signal et voir le temps qu'il met à arriver (presque une journée, à calculer à partir de la distance réelle).

Chaque histoire se termine par un **quiz de 3 questions**. Badges à débloquer, par exemple « Gardien de la Lune », « Ami des rovers », « Écho de Voyager ».

## 7. Narration audio

- Rien ne joue avant un clic de l'utilisateur (règle des navigateurs). Le bouton « Commencer le voyage » initialise Howler.
- Chaque paragraphe d'histoire a un fichier audio et des **sous-titres synchronisés** (JSON avec horodatage début/fin par phrase). Les sous-titres sont toujours disponibles, même son coupé.
- Prototype : utiliser l'API **Web Speech** (`speechSynthesis`) en voix française pour avancer vite. Version finale : voix enregistrées par l'équipe (FR et EN) dans `public/audio/{langue}/{id-machine}/{numéro}.mp3`.
- Musique d'ambiance différente par chapitre, volume bas pendant la narration (ducking).
- Effets sonores courts : bip radio, vent martien, laser. `PositionalAudio` de drei pour les sons liés à un objet 3D.
- Réglages visibles : son activé ou non, volume, sous-titres, vitesse de narration.
- Chaque fichier audio doit être libre de droits ou créé par l'équipe. Noter la source dans `content/credits.json`.

## 8. Modèle de données

Tout le contenu est dans `src/content/` en JSON, jamais en dur dans les composants. Type de base :

```ts
type Body = 'moon' | 'mars' | 'deep-space';
type Status = 'active' | 'dormant';

interface Machine {
  id: string;                    // ex. 'opportunity' (ASCII, tirets)
  name: string;                  // clé i18n
  mission: string;
  body: Body;
  lat?: number;                  // Lune et Mars
  lon?: number;                  // est positif
  launchDate: string;            // ISO
  arrivalDate?: string;
  endDate?: string;              // dernier contact
  status: Status;
  vitals: { label: string; start: number; end: number; unit: string }[];
  story: { textKey: string; audio?: string; subtitles?: string; panelImage?: string }[];
  deepDive?: string;             // clé i18n, « Pour aller plus loin »
  neighbours?: string;           // clé i18n
  earthImpact: string;           // clé i18n
  realPhoto?: { src: string; credit: string; source: string };
  model3d?: { src: string; credit: string; source: string };
  quiz: { question: string; options: string[]; answer: number; explanation: string }[];
  sources: { label: string; url: string }[];   // OBLIGATOIRE, au moins une source NASA
  verified: boolean;             // true seulement après vérification humaine
}
```

## 9. Règles d'exactitude (critère « Validité »)

- **N'invente jamais un fait, une date, un chiffre ou une coordonnée.** Si une information manque, mets `"TODO: à vérifier"` et `verified: false`.
- Chaque machine doit avoir au moins une source officielle NASA (ou JPL) dans `sources`.
- Un badge discret « à vérifier » s'affiche en développement sur toute machine avec `verified: false`. Le build de production échoue s'il en reste (script de vérification).
- Les tailles et distances 3D ne sont pas à l'échelle : l'écrire à l'écran.
- Pas de logo officiel de la NASA (son usage est réglementé). Les images et modèles NASA sont en général réutilisables, mais vérifier et créditer chacun.

## 10. Données et ressources NASA à utiliser

Vérifie chaque lien avant usage, certains ont pu changer d'adresse :
- **Modèles 3D NASA** (rovers, Ingenuity, sondes) : https://science.nasa.gov/3d-resources/
- **Images et vidéos** : https://images.nasa.gov (dispose d'une API publique)
- **Textures de la Lune** (CGI Moon Kit, données LRO) : https://svs.gsfc.nasa.gov
- **Cartes interactives Lune et Mars** : https://trek.nasa.gov
- **Positions des sondes** (Voyager, New Horizons) : https://ssd.jpl.nasa.gov/horizons/
- **Fiches de missions** : https://nssdc.gsfc.nasa.gov
- Les ressources listées dans l'onglet « Ressources » de la page du défi.

Pour la distance de Voyager, préférer des valeurs précalculées pour la date de la démo (stockées en JSON) plutôt qu'un appel réseau en direct, pour que la démo marche hors ligne.

## 11. Contenu de départ

Faits connus à **revérifier** avant de passer `verified: true`. Coordonnées en degrés, longitude est positive.

**Lune** (déjà rédigé dans le prototype) : Apollo 11 (0,674 N ; 23,473 E), Apollo 12 et Surveyor 3 (3,012 S ; 23,422 O), Apollo 14 (3,645 S ; 17,471 O), Apollo 15 (26,132 N ; 3,634 E), Apollo 16 (8,973 S ; 15,500 E), Apollo 17 (20,191 N ; 30,772 E). Réflecteurs actifs : Apollo 11, 14 et 15.

**Mars** (à rédiger) :
- Viking 1 : posé le 20 juillet 1976 dans Chryse Planitia, fonctionne jusqu'en 1982.
- Viking 2 : posé le 3 septembre 1976 dans Utopia Planitia, fonctionne jusqu'en 1980.
- Mars Pathfinder et Sojourner : posés le 4 juillet 1997 dans Ares Vallis ; premier rover sur Mars ; dernier contact en septembre 1997.
- Spirit : posé en janvier 2004 dans le cratère Gusev ; ensablé en 2009, dernier contact en 2010.
- Opportunity : posé en janvier 2004 à Meridiani Planum ; mission prévue pour 90 jours, a roulé environ 45 km ; dernier contact en juin 2018 après une tempête de poussière.
- Phoenix : posé en mai 2008 près du pôle Nord ; a confirmé la présence de glace d'eau ; s'éteint fin 2008 avec l'hiver.
- InSight : posé en novembre 2018 à Elysium Planitia ; a enregistré plus d'un millier de séismes martiens ; fin de mission en décembre 2022.
- Ingenuity : arrivé avec Perseverance en 2021 dans le cratère Jezero ; premier vol motorisé sur une autre planète ; 72 vols au lieu des 5 prévus ; pales endommagées en janvier 2024.

**Espace lointain** (à rédiger) :
- Pioneer 10 et 11 : premières sondes vers Jupiter et Saturne ; silencieuses depuis 2003 et 1995.
- Voyager 1 et 2 : lancées en 1977 ; entrées dans l'espace interstellaire en 2012 et 2018 ; toujours en contact ; disque d'or.
- New Horizons : survol de Pluton en juillet 2015 ; toujours active.

Coordonnées précises des sites martiens : les reprendre depuis les sources NASA, ne pas les estimer.

## 12. Design

- **Scène spatiale** : toujours sombre (#060B1A), étoiles discrètes, éclairage solaire latéral.
- **Interface** (panneaux, histoires, carnet) : suit le thème clair ou sombre de l'appareil.
- **Typographie** : Big Shoulders Display pour les titres, Lexend pour le texte (très lisible pour tous les lecteurs), avec polices de secours.
- **Mouvement** : un seul effet fort par écran (vol de caméra, tir laser). Respecter `prefers-reduced-motion` : vols de caméra remplacés par des fondus, pas de rotation automatique.
- **Ton des textes** : phrases courtes et claires, compréhensibles sans prérequis mais jamais infantilisantes ; voix du robot à la première personne ; tutoiement du lecteur. Le vocabulaire technique est permis s'il est expliqué. Le détail scientifique va dans « Pour aller plus loin ».
- **Accessibilité** : tout ce qui est cliquable en 3D existe aussi en liste accessible au clavier ; contraste suffisant ; sous-titres ; focus visible.

## 13. Performance

- Cible : PC portable d'entrée de gamme et téléphone Android milieu de gamme, connexion lente.
- Charger chaque chapitre à la demande (`React.lazy` + `Suspense` avec un écran de chargement narratif).
- Modèles GLB compressés (Draco ou meshopt), textures ≤ 2048 px, `AdaptiveDpr` et `PerformanceMonitor` pour baisser la qualité automatiquement.
- **Mode léger** : si WebGL est absent ou lent, afficher une version 2D (cartes SVG) avec les mêmes histoires.
- Objectif : premier écran affiché en moins de 3 secondes en 4G.

## 14. Structure du dépôt

```
reference/                 prototype HTML d'origine
public/
  audio/{fr,en}/...        narration, musique, effets
  models/                  GLB
  textures/                Lune, Mars, Terre
src/
  app/                     routes, layout, providers
  scenes/                  Earth, Moon, Mars, DeepSpace (R3F)
  components/3d/           Globe, SiteMarker, Laser, CameraRig
  components/story/        StoryPanel, VitalsGauge, Timeline, Subtitles, DeepDive
  components/ui/           boutons, réglages, carnet
  games/                   LaserShot, HammerFeather, IngenuityPilot, DustPanels, VoyagerSignal
  audio/                   service Howler, gestion des sous-titres
  content/                 machines/*.json, quiz, credits.json, i18n/{fr,en}.json
  store/                   Zustand
  lib/                     conversions lat/lon, calculs de temps-lumière
scripts/
  check-content.ts         échoue si une machine n'a pas de source ou n'est pas vérifiée
```

## 15. Priorités (hackathon)

**MVP, à finir en premier :**
1. Squelette React + R3F, accueil, navigation entre chapitres.
2. Chapitre Lune porté depuis le prototype, avec le tir laser.
3. Chapitre Mars avec au moins Opportunity, Spirit et Ingenuity.
4. Une histoire complète avec narration audio (Web Speech) et sous-titres.
5. Quiz et carnet de badges.
6. Page Sources.
7. Mode démo jury.

**Bonus, si le temps le permet :** chapitre espace lointain complet, mini-jeux physiques (marteau-plume, Ingenuity), anglais, voix enregistrées, PWA hors ligne.

## 16. Manière de travailler

- Avance par petites étapes qui fonctionnent, avec un commit clair à chaque étape.
- Après chaque fonctionnalité, vérifie que `npm run build` passe et que l'application tourne.
- Le dépôt doit pouvoir être public (Space Apps demande en général un lien vers le code) : pas de clé, pas de secret.
- Tiens à jour un `README.md` pour le jury : le défi, le concept, comment lancer le projet, les sources, les crédits.
- En cas de doute sur un fait scientifique, ne devine pas : signale-le-moi.
