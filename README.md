# Sankofa : les héros oubliés de l'espace

Projet de l'équipe **G. Bugs** (Abidjan) pour le **NASA Space Apps Challenge 2026**, défi
[*Abandoned but not Forgotten*](https://www.spaceappschallenge.org/2026/challenges/nasas-discarded-equipment-storytelling/).

Une web app éducative pour les élèves. Sankofa, un robot-guide, leur fait découvrir les engins que la
NASA a laissés sur la Lune, sur Mars et ailleurs dans le système solaire. Chaque engin raconte son
histoire, ce qu'il a découvert et ce qu'il est devenu.

Le plan complet (concept, répartition des tâches, planning) est dans [docs/PLAN.md](docs/PLAN.md).

## Structure

```
backend/   API Django + Django REST Framework, et admin de saisie du contenu
frontend/  Application React + TypeScript (Vite)
docs/      Plan du projet
```

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

| Route | Description |
|---|---|
| `GET /api/bodies/` | Les lieux de l'Atlas (Lune, Mars, Ailleurs) |
| `GET /api/equipment/?body=mars&status=silent` | Les héros, avec filtres facultatifs |
| `GET /api/equipment/<slug>/` | Fiche complète : chapitres, quiz, sources |

Toutes les routes acceptent `?lang=fr` (par défaut) ou `?lang=en`. Si un texte n'est pas encore
traduit, l'API renvoie le français.

## Lancer le frontend

Prérequis : Node.js 20 ou plus récent. Le backend doit tourner en parallèle sur le port 8000.

```bash
cd frontend
npm install
npm run dev                       # http://localhost:5173
```

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

Bibliothèques : Django, Django REST Framework, django-cors-headers, Pillow, React, React Router,
Vite, Phosphor Icons, polices Fira Sans et Overpass (SIL OFL, via Fontsource).

> **À vérifier par le rôle Science avant la soumission** : les coordonnées d'Opportunity
> (lieu de repos final) et d'Ingenuity (position actuelle) sont approximatives.

Ce projet n'utilise aucun logo ni élément de marque de la NASA. Il n'est ni approuvé ni soutenu par la NASA.

## Utilisation de l'IA

Un assistant de code IA (Claude) a aidé à écrire le code et les premiers textes. Tous les contenus
sont relus par l'équipe.
