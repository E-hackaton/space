# Sankofa : concept produit v2 (3D, voix, multilingue, PWA)

**Équipe G. Bugs · NASA Space Apps Challenge 2026 · Abidjan**
Rédigé le samedi 14 novembre 2026, après la séance d'idéation de l'équipe. Complète [PLAN.md](PLAN.md)
(défi, rôles, règles de soumission).

---

## 1. La promesse en une phrase

> **Redonner vie aux machines oubliées de l'espace.** Dans un univers 3D simple et apaisant,
> Sankofa, un petit robot-guide, emmène chacun, de 7 à 40 ans, à la rencontre des engins laissés
> sur la Lune, sur Mars et dans l'espace profond. Chaque machine raconte elle-même son histoire,
> année après année, avec une vraie voix, en français ou en anglais.

**Le problème** : l'histoire de ces machines existe, mais elle est racontée par des experts, pour
des experts. Les sites de la NASA sont denses et techniques.
**Notre réponse** : simplifier sans trahir. Une idée par écran, une voix qui raconte, une machine
qu'on peut tourner dans ses mains.

---

## 2. Les principes de design

| Principe | Concrètement |
|---|---|
| **Minimaliste, pas vide** | Fond noir spatial, une seule couleur d'accent par monde (argent, rouille, violet), beaucoup d'espace. Pas plus de 2 boutons visibles à la fois. |
| **Une idée par écran** | Chaque écran répond à une seule question : « Où aller ? », « Qui est là ? », « Que s'est-il passé ? ». |
| **Le texte est court, la voix raconte** | Bulles de 2 phrases maximum. Le détail passe par l'audio et la 3D. |
| **Ludique, pas enfantin** | Ton chaleureux, vocabulaire simple, mais vrais chiffres et vraies dates. Les 40 ans ne doivent pas se sentir infantilisés. |
| **3D au service du récit** | La 3D sert à montrer, pas à décorer : on tourne la machine, la caméra va vers la pièce dont on parle. |
| **Toujours un repli** | Si la 3D ne passe pas (vieux téléphone, économie de données), l'histoire reste complète en 2D. |
| **Mobile d'abord** | Beaucoup d'élèves à Abidjan découvriront le site sur un téléphone Android de milieu de gamme, avec peu de data. |
| **Accessible** | Sous-titres de toutes les voix, navigation au clavier, contraste élevé, animations réduites si demandé. |

---

## 3. Le parcours (flow)

```
 ┌──────────┐   ┌─────────────┐   ┌───────────────┐   ┌──────────────┐   ┌───────────────┐   ┌────────────┐
 │ 0. Envol │ → │ 1. Sankofa  │ → │ 2. Choisis    │ → │ 3. L'univers │ → │ 4. La machine │ → │ 5. Le défi │
 │ (charge- │   │ t'accueille │   │ ton univers   │   │ (Mars…)      │   │ raconte son   │   │ + la carte │
 │  ment)   │   │ (guide)     │   │ (3 astres 3D) │   │ machines 3D  │   │ histoire      │   │ à gagner   │
 └──────────┘   └─────────────┘   └───────────────┘   └──────────────┘   └───────────────┘   └────────────┘
                                                                                                    │
                                          ┌──────────────── 6. Ma collection ◄─────────────────────┘
```

### Écran 0 : L'envol (chargement)
- Un fond étoilé et Sankofa qui s'allume. La barre de chargement est une trajectoire Terre → Lune.
- **Choix de la langue dès ici** : 🇫🇷 Français / 🇬🇧 English. La langue du navigateur est proposée par défaut.
- Un bouton « Activer le son » (les navigateurs bloquent l'audio tant qu'on n'a pas cliqué).

### Écran 1 : Sankofa t'accueille (visite de l'interface)
Le guide se présente en **4 étapes courtes**, avec sa voix. Chaque étape met en lumière une zone de
l'écran ; les étapes sont **passables** et **revisibles** (bouton « ? » permanent).

| Étape | Sankofa dit (version FR, environ 10 secondes chacune) |
|---|---|
| 1. Qui je suis | « Salut ! Je suis Sankofa. Mon nom vient d'un symbole akan : *revenir chercher ce qu'on a oublié*. » |
| 2. Pourquoi on est là | « Depuis 1966, des dizaines de machines ont été laissées dans l'espace. Elles ont des histoires incroyables à raconter. » |
| 3. Comment ça marche | « Choisis un monde, touche une machine, et écoute-la raconter sa mission. » |
| 4. Ce que tu gagnes | « Réussis son défi et gagne sa carte. Prêt ? Choisis ton premier monde ! » |

### Écran 2 : Choisis ton univers
- **Trois astres en 3D**, qui tournent lentement : la **Lune**, **Mars**, et pour l'**espace profond**
  une petite scène (astéroïde Éros, sonde qui s'éloigne).
- Au survol ou au toucher : nom, nombre de machines, une phrase d'accroche.
- Un toucher : la caméra plonge vers l'astre (transition de 1 à 2 secondes), puis on arrive dans l'univers.

### Écran 3 : L'univers (exemple : Mars)
- **Le globe de Mars en 3D**, avec les **machines posées à leur vraie position** (latitude et longitude réelles).
  Les machines silencieuses sont des **fantômes translucides** ; les actives brillent.
- **Sankofa fait la tournée** : il vole d'une machine à l'autre (la caméra le suit) et présente chacune
  en une phrase. On peut l'interrompre à tout moment en touchant une machine.
- **La machine à remonter le temps** (déjà développée) : un curseur de 1966 à aujourd'hui. Les machines
  apparaissent à leur arrivée et s'éteignent à la fin de leur mission.
- Un bouton discret « Voir en liste », pour l'accessibilité et les petits écrans.

### Écran 4 : La machine raconte son histoire (visite guidée chronologique)
C'est **le cœur de l'expérience**.
- **Le modèle 3D de la machine**, au centre. On peut le tourner avec le doigt ou la souris.
- **Une frise d'étapes datées** en bas de l'écran. Exemple pour Opportunity :

  | Date | Étape | Ce que fait la 3D |
  |---|---|---|
  | Juillet 2003 | Le décollage | La caméra est large ; la machine dans sa coque |
  | 25 janvier 2004 | « Un trou en un » | Zoom sur les roues ; le cratère Eagle apparaît au sol |
  | 2004 | Les myrtilles de Mars | Zoom sur le bras robotique et ses instruments |
  | 2015 | Un marathon martien | Les roues tournent ; un compteur de kilomètres défile |
  | 10 juin 2018 | La grande tempête | Le ciel s'assombrit ; les panneaux se couvrent de poussière |
  | Aujourd'hui | Ce que je deviens | La machine devient fantôme, calme |

- **Chaque étape = une voix + 2 phrases de sous-titre + un mouvement de caméra vers la pièce concernée.**
  Lecture automatique (comme un mini-documentaire) ou étape par étape.
- **« La science que j'ai rendue possible »** : la découverte clé, en une carte claire à la fin.
- **« Mes sources »** : liens NASA (validité scientifique, exigée par le défi).

### Écran 5 : Le défi (déjà développé, à intégrer)
- **L'expérience interactive** propre à la machine (laser Terre-Lune, vol d'Ingenuity, poussière d'Opportunity).
- **Le quiz** de 2 ou 3 questions. En cas de réussite, **la carte de la machine se retourne et rejoint la collection**.

### Écran 6 : Ma collection
- Les cartes gagnées, le grade d'explorateur, et les machines encore à découvrir, affichées en fantômes.

---

## 4. Sankofa, le guide

- **Apparence** : petit robot rond, en 3D *low-poly* (formes simples, sans texture lourde). Il est
  construit **directement en code** à partir de formes géométriques : aucun modèle à télécharger,
  il s'affiche instantanément.
- **Animations** : il flotte, cligne des yeux, se tourne vers ce dont il parle, et ses yeux s'animent quand il parle.
- **Règles d'écriture** : 2 phrases maximum par bulle, tutoiement, une seule information à la fois.
- **Ne jamais bloquer** : bouton « Passer » sur chaque intervention, bouton « Couper le son » toujours visible,
  et un mode « Guide désactivé » mémorisé.

---

## 5. Les machines en 3D

- **Source : NASA 3D Resources**. Environ 380 modèles officiels, gratuits, au format GLB, sous les
  règles d'usage des médias NASA. Il faut les créditer.
  Catalogue : https://science.nasa.gov/3d-resources/ (miroir : https://github.com/nasa/NASA-3D-Resources).
  **À vérifier en priorité (rôle Science/3D)** : la disponibilité d'un modèle pour chaque machine
  (Apollo LM, LRV, Viking, Opportunity/MER, InSight, Ingenuity, Pioneer…). S'il n'y en a pas, on
  utilise un modèle *low-poly* simplifié, fait par nous.
- **Vérifier qu'aucun modèle n'affiche de logo NASA** sur ses textures (règle du concours). Sinon, retoucher la texture.
- **Optimisation obligatoire** (mobile, data) : compression des GLB (gltf-transform, Draco ou meshopt),
  objectif **moins de 2 Mo par machine**, chargement uniquement à l'ouverture de la machine.
- **Points d'intérêt** : pour chaque étape de la visite, une position de caméra et la pièce à mettre
  en lumière (roues, bras, panneaux, antenne…).
- **Globes** : on réutilise nos cartes NASA de la Lune et de Mars (déjà dans le projet) comme textures de sphère.

---

## 6. Les voix (ElevenLabs)

### Architecture recommandée : voix pré-générées, jamais en direct
```
 Textes (admin Django) ──► commande `generate_voices` ──► API ElevenLabs ──► fichiers MP3 (FR et EN)
                                                                                   │
 Navigateur ◄──────────────── l'API renvoie l'URL de l'audio de chaque étape ◄────┘
```
- **La clé API ElevenLabs reste sur le serveur** (variable d'environnement), jamais dans le navigateur :
  sinon n'importe qui pourrait la voler.
- **Les audios sont générés une fois**, au moment où le contenu est validé : pas de coût ni d'attente
  pour chaque visiteur, et l'audio peut être mis en cache hors ligne (PWA).
- **Régénération automatique** seulement si le texte a changé (on mémorise une empreinte du texte).
- **Repli** : si un audio manque, lecture par la voix du navigateur (déjà développée).
- **Voix** : une voix pour Sankofa (chaleureuse, enjouée), une voix pour les machines (posée, un peu
  « radio »). Elles sont choisies dans la bibliothèque ElevenLabs, en version **multilingue** pour le FR et l'EN.

### Points d'attention
- **Quota** : 10 machines × environ 1 500 caractères × 2 langues ≈ **30 000 caractères**, plus environ
  3 000 pour le guide. Il faut vérifier que le forfait de l'équipe couvre ce volume (l'offre gratuite
  est plus limitée).
- **Licence** : vérifier les conditions du forfait (attribution exigée sur l'offre gratuite).
- **Concours** : déclarer ElevenLabs dans la rubrique « Utilisation de l'IA » du formulaire, et l'indiquer
  dans le site (« Voix générées avec ElevenLabs »).

---

## 7. Les langues (FR / EN, extensible)

| Élément | Comment il change de langue |
|---|---|
| Textes de l'interface (boutons, menus) | Dictionnaire de traductions côté frontend (`fr.json`, `en.json`) |
| Contenus (histoires, quiz, découvertes) | Déjà bilingues dans la base ; l'API répond selon `?lang=` (**déjà en place**) |
| Voix | Un fichier audio par langue et par texte |
| Vidéos | **Une seule vidéo + sous-titres** par langue (fichiers `.vtt`), plutôt qu'une vidéo par langue |
| Choix de la langue | À l'arrivée, puis à tout moment dans l'en-tête ; mémorisé sur l'appareil |

Ajouter une langue (ex. une langue ivoirienne plus tard) = un fichier de traduction + les champs de
contenu + une génération de voix. Aucun changement de code.

---

## 8. La version mobile (PWA)

- **Installable** sur l'écran d'accueil (icône Sankofa, plein écran), via `vite-plugin-pwa`.
- **Hors ligne** : l'interface, les textes et les audios déjà écoutés restent disponibles. Les modèles 3D
  sont mis en cache après la première ouverture.
- **Budget de performance** : premier affichage en moins de 3 Mo, 3D chargée seulement à la demande,
  et un mode « Économie de données » (2D seulement).

---

## 9. Ce qu'on garde de ce qui existe déjà

| Déjà développé | Devient |
|---|---|
| API Django + admin + 10 machines sourcées | La base de tout le contenu (on enrichit le modèle, voir ci-dessous) |
| Machine à remonter le temps | Intégrée à l'écran 3 (univers) |
| Expériences interactives (laser, Ingenuity, Opportunity) | L'écran 5 (défi) |
| Quiz, cartes, collection, grades | Les écrans 5 et 6 |
| Thèmes de couleur par monde | Les accents de chaque univers 3D |
| Lecture vocale du navigateur | Le repli des voix ElevenLabs |
| Contenus bilingues + `?lang=` | Le socle du multilingue |

### Évolution des données
Les « chapitres » deviennent des **étapes de mission datées** :

| Champ | Exemple |
|---|---|
| `date` (ou année) | 2004-01-25 |
| `title_fr` / `title_en`, `body_fr` / `body_en` | « Un trou en un » |
| `focus` | `wheels` (la pièce que la caméra montre) |
| `audio_fr` / `audio_en` | fichiers générés par ElevenLabs |

---

## 10. Stack technique ajoutée

| Besoin | Outil |
|---|---|
| 3D dans React | **three.js** via **@react-three/fiber**, avec les aides de **@react-three/drei** (caméra, chargement GLB, contrôles) |
| Animations de caméra | drei (`CameraControls`) |
| Optimisation des modèles | gltf-transform (en ligne de commande, avant la mise en ligne) |
| Voix | API ElevenLabs, appelée **uniquement** depuis une commande Django |
| PWA | vite-plugin-pwa (Workbox) |
| Traductions de l'interface | Dictionnaires JSON + un petit hook `useT()` (ou react-i18next si besoin) |

---

## 11. Priorités : ce qu'on livre d'ici dimanche 23h59

Il reste environ **33 heures**. Tout ne tiendra pas : on classe.

| Priorité | Contenu |
|---|---|
| 🔴 **Indispensable** | Écran de choix des univers en 3D (Lune, Mars, espace profond) · Globe 3D avec machines cliquables · Vue 3D d'au moins **3 machines** avec visite chronologique · Guide Sankofa (onboarding 4 étapes, bulles + voix) · FR/EN sur l'interface et les contenus · Voix ElevenLabs pour le guide et ces 3 machines · Intégration du défi et de la collection existants |
| 🟠 **Important** | PWA installable · Toutes les machines en 3D · Sankofa qui vole de machine en machine · Mode 2D de repli |
| 🟢 **Bonus** | Hors ligne complet · Vidéos sous-titrées · Mode « Junior / Explorateur » (2 niveaux de texte) · Troisième langue |

**Choix des 3 machines vitrines** (les plus spectaculaires à raconter en 3D) : **Opportunity**
(Mars), **le module lunaire Eagle d'Apollo 11** (Lune), **Ingenuity** (Mars, animation des pales).

### Planning révisé

| Créneau | 3D / Front | Backend / Voix | Contenu / Design | Pitch |
|---|---|---|---|---|
| **Sam. 14h–18h** | Installer three.js, écran de choix des univers, globe de Mars | Modèle « étapes datées », champs audio, commande `generate_voices` | Récupérer les GLB NASA des 3 machines, écrire les étapes datées | Script du guide (FR/EN) |
| **Sam. 18h–00h** | Visionneuse 3D de machine et visite guidée | Générer les voix (guide et 3 machines) | Traduire en EN, vérifier les faits | Storyboard de la vidéo |
| **Dim. 08h–13h** | Guide Sankofa 3D, i18n de l'interface, PWA | Déploiement | Tests avec de vrais utilisateurs (enfant, adulte) | |
| **Dim. 13h** | **🎯 Gel des fonctionnalités** | | | |
| **Dim. 13h–21h** | Corrections, performances mobile | | | **Vidéo de 30 s + formulaire** |
| **Dim. 21h–23h** | **Soumission** | | | |

---

## 12. Décisions à prendre maintenant

1. **ElevenLabs** : avez-vous un compte ? Quel forfait (quota de caractères) ? Qui garde la clé API ?
2. **Les voix** : une voix pour Sankofa et une autre pour les machines, ou une voix différente par machine ?
3. **Le nom du site** : on garde « Sankofa » ?
4. **Le public** : 7–40 ans en un seul niveau de texte (recommandé pour le hackathon), ou deux niveaux ?

---

## 13. Risques et parades

| Risque | Parade |
|---|---|
| Pas de modèle 3D NASA pour une machine | Modèle *low-poly* simplifié fait en code, ou remplacer la machine vitrine |
| 3D trop lourde sur téléphone | Modèles compressés, chargement à la demande, mode 2D de repli |
| Quota ElevenLabs épuisé | Voix ElevenLabs pour le guide et les 3 vitrines seulement ; voix du navigateur ailleurs |
| La clé API fuit | Elle reste côté serveur, jamais dans le dépôt Git (fichier `.env` ignoré) |
| Trop d'ambition pour 33 heures | Respecter les priorités de la section 11 ; geler dimanche à 13h |
| Erreur scientifique dans une étape | Le rôle Science valide chaque étape datée avant la génération des voix |

---

*Sources : NASA 3D Resources (https://science.nasa.gov/3d-resources/), NASA Images and Media Usage
Guidelines, page du défi Space Apps 2026.*
