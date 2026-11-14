"""
Réglages Django du projet Sankofa.

Les valeurs sensibles ou propres à l'environnement (clé secrète, mode debug,
hôtes autorisés, origines CORS) sont lues dans des variables d'environnement,
avec des valeurs par défaut pensées pour le développement local.
Le même fichier sert donc en local et en production.
"""

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent


def env_bool(name: str, default: bool) -> bool:
    """Lit une variable d'environnement booléenne ("1", "true", "yes" = vrai)."""
    value = os.environ.get(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def env_list(name: str, default: str) -> list[str]:
    """Lit une liste séparée par des virgules, en ignorant les éléments vides."""
    return [item.strip() for item in os.environ.get(name, default).split(",") if item.strip()]


# --- Sécurité -----------------------------------------------------------------

# La clé par défaut ne sert qu'en local : en production, DJANGO_SECRET_KEY est obligatoire.
SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "dev-only-insecure-key-change-me")
DEBUG = env_bool("DJANGO_DEBUG", default=True)
ALLOWED_HOSTS = env_list("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1")


# --- Applications -------------------------------------------------------------

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Bibliothèques tierces
    "rest_framework",
    "corsheaders",
    # Applications du projet
    "heroes",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    # CorsMiddleware doit passer avant tout middleware qui peut produire une réponse.
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"


# --- Base de données ----------------------------------------------------------

# SQLite suffit pour un hackathon : le contenu est petit et surtout lu.
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]


# --- Langue et fuseau horaire -------------------------------------------------

LANGUAGE_CODE = "fr-fr"
TIME_ZONE = "Africa/Abidjan"
USE_I18N = True
USE_TZ = True


# --- Fichiers statiques et médias ---------------------------------------------

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

# Images téléversées via l'admin (photos des engins, cartes de la Lune et de Mars).
MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# --- Django REST Framework ----------------------------------------------------

REST_FRAMEWORK = {
    # L'API publique est en lecture seule : aucune authentification n'est nécessaire.
    # Toute écriture passe par l'admin Django, qui a sa propre authentification.
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.AllowAny"],
    # Latitude et longitude sortent en nombres JSON, pas en chaînes : le frontend les utilise
    # directement dans ses calculs.
    "COERCE_DECIMAL_TO_STRING": False,
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
        # L'interface navigable de DRF est pratique pour explorer l'API en développement.
        *(["rest_framework.renderers.BrowsableAPIRenderer"] if DEBUG else []),
    ],
}


# --- CORS ---------------------------------------------------------------------

# Le frontend Vite tourne sur le port 5173 en développement.
CORS_ALLOWED_ORIGINS = env_list(
    "DJANGO_CORS_ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173",
)
