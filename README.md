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
frontend/  Application React + TypeScript (Vite), en cours
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

## Données et références

Les données proviennent des ressources NASA indiquées par le défi, principalement le
[NSSDCA](https://nssdc.gsfc.nasa.gov/) et les pages missions de [NASA Science](https://science.nasa.gov/).
Chaque héros liste ses sources dans l'API (champ `sources`).

> **À vérifier par le rôle Science avant la soumission** : les coordonnées d'Opportunity
> (lieu de repos final) et d'Ingenuity (position actuelle) sont approximatives.

Ce projet n'utilise aucun logo ni élément de marque de la NASA. Il n'est ni approuvé ni soutenu par la NASA.

## Utilisation de l'IA

Un assistant de code IA (Claude) a aidé à écrire le code et les premiers textes. Tous les contenus
sont relus par l'équipe.
