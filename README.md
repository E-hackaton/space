# FORBITS : Their missions ended. Their stories live on.

Projet de l'équipe **G. Bugs** (Abidjan) pour le **NASA Space Apps Challenge 2026**, défi
[_Abandoned but not Forgotten_](https://www.spaceappschallenge.org/2026/challenges/nasas-discarded-equipment-storytelling/).
En ligne : **https://space.techledger.io**

Un jeu éducatif en 3D, en français et en anglais. Sankofa, un petit robot guide, emmène le joueur
dans le Système solaire, à la rencontre des machines que la NASA a laissées sur la Lune, sur Mars et au-delà.

- **Missions** : on choisit une machine, la fusée décolle, voyage et se pose ; la machine se présente
  (« Bonjour, je suis Opportunity… ») puis raconte sa mission étape par étape, avec sa voix, ses
  « constantes vitales » qui baissent et son vrai modèle 3D NASA. Un quiz fait gagner son badge.
- **Explorer** : on pilote un petit rover sur Terre, on décolle vers la Lune ou Mars, et l'on revoit
  les vrais trajets de Perseverance, Curiosity et Ingenuity, sol par sol (données NASA/JPL).
- **Carnet** (badges gagnés) et **Sources** (toutes les références, machine par machine).

Documents :

- [docs/CONCEPT.md](docs/CONCEPT.md) : concept produit et parcours
- [docs/PLAN.md](docs/PLAN.md) : défi, rôles et planning
- [docs/SUBMISSION.md](docs/SUBMISSION.md) : textes du formulaire de soumission et script de la vidéo
- [docs/BRIEF_JEU.md](docs/BRIEF_JEU.md) : brief d'origine du jeu « Les Veilleurs du Système solaire », base du frontend

## Structure

```
backend/   API Django + Django REST Framework : contenu des 13 machines (FR/EN), quiz, sources,
           voix ElevenLabs, et admin de saisie
frontend/  Le jeu : React + TypeScript (Vite), React Three Fiber, GSAP, Tailwind, Zustand, i18next
docs/      Concept, plan, brief du jeu et textes de soumission
deploy/    Image web (build du frontend + Caddy) et configuration Caddy
```

Le **contenu** (récits, dates, quiz, sources, voix) n'existe qu'à un endroit : l'API Django.
Le frontend n'ajoute que la **mise en scène** propre au jeu (`frontend/src/content/staging.ts` :
jauges, effets spéciaux, modèle 3D de chaque machine).

## Lancer le backend

Prérequis : Python 3.12.

```bash
cd backend
python -m venv .venv
.venv/Scripts/activate            # Windows (sous macOS/Linux : source .venv/bin/activate)
pip install -r requirements.txt
python manage.py migrate
python manage.py load_heroes      # charge le contenu de départ (heroes/data/heroes.json)
python manage.py createsuperuser  # pour accéder à l'admin
python manage.py runserver
```

- API : http://127.0.0.1:8000/api/
- Admin (saisie des histoires, quiz, sources) : http://127.0.0.1:8000/admin/
- Tests : `python manage.py test heroes`

### Routes de l'API

| Route                                         | Description                                 |
| --------------------------------------------- | ------------------------------------------- |
| `GET /api/bodies/`                            | Les lieux de l'Atlas (Lune, Mars, Ailleurs) |
| `GET /api/equipment/?body=mars&status=silent` | Les héros, avec filtres facultatifs         |
| `GET /api/equipment/<slug>/`                  | Fiche complète : chapitres, quiz, sources   |

Toutes les routes acceptent `?lang=fr` (par défaut) ou `?lang=en`. Si un texte n'est pas encore
traduit, l'API renvoie le français.

## Lancer le frontend

Prérequis : Node.js 20 ou plus récent. Le backend doit tourner en parallèle sur le port 8000.

```bash
cd frontend
npm install
npm run dev                       # http://localhost:3000 (aussi accessible depuis un téléphone du réseau local)
```

Les trajets des rovers (`public/data/*.json`) sont produits par `frontend/scripts/build_traverses.py`
à partir des fichiers GeoJSON NASA/JPL MMGIS (voir l'en-tête du script).

En développement, Vite redirige `/api` et `/media` vers Django : aucune configuration CORS à faire.
Pour un backend hébergé ailleurs, définir `VITE_API_URL` (ex. `https://mon-api.onrender.com`).

## Données et références

Les données proviennent des ressources NASA indiquées par le défi, principalement le
[NSSDCA](https://nssdc.gsfc.nasa.gov/) et les pages missions de [NASA Science](https://science.nasa.gov/).
Chaque héros liste ses sources dans l'API (champ `sources`).

Cartes de fond (domaine public) :

- Lune : mosaïque couleur LRO, [CGI Moon Kit, NASA Scientific Visualization Studio](https://svs.gsfc.nasa.gov/4720/)
- Mars : mosaïque couleur Viking MDIM 2.1, NASA/JPL/USGS
  ([USGS Astrogeology](https://astrogeology.usgs.gov/search/map/mars_viking_colorized_global_mosaic_232m)),
  version réduite téléchargée depuis [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Mars_Viking_MDIM21_ClrMosaic_1km.jpg)

Modèles 3D : [NASA 3D Resources](https://science.nasa.gov/3d-resources/) (Perseverance, Curiosity,
Ingenuity, Opportunity, Viking, module lunaire Apollo), optimisés par l'équipe. Textures des planètes et
trajets des rovers : voir la page Sources du site (`frontend/src/content/credits.json`).

Bibliothèques : Django, Django REST Framework, django-cors-headers, Pillow, gunicorn, React, React Router,
Vite, Three.js, React Three Fiber, drei, GSAP, Motion, Tailwind CSS, Zustand, i18next, vite-plugin-pwa.

> **À vérifier par le rôle Science avant la soumission** : les coordonnées d'Opportunity
> (lieu de repos final) et d'Ingenuity (position actuelle) sont approximatives.

Ce projet n'utilise aucun logo ni élément de marque de la NASA. Il n'est ni approuvé ni soutenu par la NASA.

## Utilisation de l'IA

Un assistant de code IA (Claude) a aidé à écrire le code et les premiers textes. Tous les contenus
sont relus par l'équipe et vérifiés à partir des sources NASA.

Les voix des machines sont générées avec **ElevenLabs** (présentations et récits en français ;
le reste de l'anglais est lu par la voix du navigateur). Pour les régénérer, ajouter
dans `.env` les variables `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_GUIDE` et `ELEVENLABS_VOICE_MACHINE`,
puis lancer `python manage.py generate_voices` (`--dry-run` pour estimer le volume de caractères d'abord).
