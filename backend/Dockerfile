# Image du backend Django (API + admin), servie par gunicorn.
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Les dépendances d'abord : cette couche reste en cache tant que requirements.txt ne change pas.
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

# Le conteneur ne tourne pas en root. Les dossiers montés en volume appartiennent à cet utilisateur.
RUN useradd --create-home --uid 1001 app \
    && mkdir -p /app/data /app/staticfiles /app/media \
    && chown -R app:app /app
USER app

EXPOSE 8000
ENTRYPOINT ["sh", "/app/entrypoint.sh"]
