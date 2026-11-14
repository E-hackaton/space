#!/bin/sh
# Démarrage du conteneur backend : prépare la base et les fichiers statiques, puis lance gunicorn.
set -e

python manage.py migrate --noinput
python manage.py collectstatic --noinput
# Charge le contenu de départ. Sans --overwrite, les modifications faites dans l'admin sont conservées.
python manage.py load_heroes

# exec : gunicorn remplace le shell et reçoit directement les signaux d'arrêt de Docker.
exec gunicorn config.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers "${GUNICORN_WORKERS:-3}" \
    --access-logfile -
