"""Exporte le contenu de l'API en fichiers JSON statiques pour le frontend.

Le site les utilise quand l'API Django ne répond pas (démo hors ligne, serveur arrêté) :
mêmes réponses que `/api/equipment/` et `/api/equipment/<slug>/`, en français et en anglais.

    python manage.py export_static_api                      # → ../frontend/public/data/api
    python manage.py export_static_api --out chemin/vers/dossier

Aucun serveur n'est lancé : les requêtes passent par le client de test de Django.
À relancer après chaque modification du contenu dans l'admin.
"""

import json
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand
from django.test import Client
from django.test.utils import override_settings

LANGS = ("fr", "en")


class Command(BaseCommand):
    help = "Exporte /api/equipment (liste et fiches, fr et en) en JSON statiques pour le frontend."

    def add_arguments(self, parser):
        default = Path(settings.BASE_DIR).parent / "frontend" / "public" / "data" / "api"
        parser.add_argument("--out", default=str(default), help="Dossier de sortie")

    def handle(self, *args, out, **options):
        out_dir = Path(out)
        (out_dir / "equipment").mkdir(parents=True, exist_ok=True)
        # Le client de test passe par l'hôte « testserver » : on l'autorise le temps de l'export.
        with override_settings(ALLOWED_HOSTS=[*settings.ALLOWED_HOSTS, "testserver"]):
            client = Client()
            total = 0
            for lang in LANGS:
                listing = self._get(client, f"/api/equipment/?lang={lang}")
                self._write(out_dir / f"equipment-{lang}.json", listing)
                for item in listing:
                    slug = item["slug"]
                    detail = self._get(client, f"/api/equipment/{slug}/?lang={lang}")
                    self._write(out_dir / "equipment" / f"{slug}-{lang}.json", detail)
                    total += 1
        self.stdout.write(self.style.SUCCESS(f"{total} fiches exportées dans {out_dir}"))

    def _get(self, client, url):
        response = client.get(url, HTTP_ACCEPT="application/json")
        if response.status_code != 200:
            raise RuntimeError(f"{url} → {response.status_code}")
        return response.json()

    @staticmethod
    def _write(path, data):
        path.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
