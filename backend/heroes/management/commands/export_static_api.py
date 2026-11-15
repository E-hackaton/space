"""Exporte le contenu de l'API en fichiers JSON statiques pour le frontend.

Le site les utilise quand l'API Django ne répond pas (démo hors ligne, serveur arrêté) :
mêmes réponses que `/api/equipment/` et `/api/equipment/<slug>/`, en français et en anglais.

Les fichiers de média cités dans ces réponses (voix ElevenLabs, images) sont copiés dans
`frontend/public/static-media/` et leurs adresses réécrites : la voix marche aussi sans Django.
(Pas dans `public/media/` : en développement, Vite envoie `/media/` vers Django.)

    python manage.py export_static_api                      # → ../frontend/public/data/api
    python manage.py export_static_api --out chemin/vers/dossier

Aucun serveur n'est lancé : les requêtes passent par le client de test de Django.
À relancer après chaque modification du contenu dans l'admin.
"""

import json
import shutil
from pathlib import Path
from urllib.parse import urlparse

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
        # Copie des médias : public/static-media, vidé à chaque export (pas de fichiers périmés).
        self.media_out = out_dir.parent.parent / "static-media"
        if self.media_out.exists():
            shutil.rmtree(self.media_out)
        self.copied = 0
        # Le client de test passe par l'hôte « testserver » : on l'autorise le temps de l'export.
        with override_settings(ALLOWED_HOSTS=[*settings.ALLOWED_HOSTS, "testserver"]):
            client = Client()
            total = 0
            for lang in LANGS:
                listing = self._localize(self._get(client, f"/api/equipment/?lang={lang}"))
                self._write(out_dir / f"equipment-{lang}.json", listing)
                for item in listing:
                    slug = item["slug"]
                    detail = self._localize(self._get(client, f"/api/equipment/{slug}/?lang={lang}"))
                    self._write(out_dir / "equipment" / f"{slug}-{lang}.json", detail)
                    total += 1
        self.stdout.write(self.style.SUCCESS(f"{total} fiches exportées dans {out_dir}, {self.copied} fichiers de média copiés dans {self.media_out}"))

    def _get(self, client, url):
        response = client.get(url, HTTP_ACCEPT="application/json")
        if response.status_code != 200:
            raise RuntimeError(f"{url} → {response.status_code}")
        return response.json()

    def _localize(self, data):
        """Remplace chaque adresse de média par celle de sa copie statique (et copie le fichier)."""
        if isinstance(data, list):
            return [self._localize(x) for x in data]
        if isinstance(data, dict):
            return {k: self._localize(v) for k, v in data.items()}
        if isinstance(data, str):
            path = urlparse(data).path
            prefix = "/" + settings.MEDIA_URL.strip("/") + "/"
            if path.startswith(prefix):
                relative = path[len(prefix):]
                source = Path(settings.MEDIA_ROOT) / relative
                if source.is_file():
                    target = self.media_out / relative
                    target.parent.mkdir(parents=True, exist_ok=True)
                    if not target.exists():
                        shutil.copy2(source, target)
                        self.copied += 1
                    return f"/static-media/{relative}"
                self.stderr.write(f"Média introuvable, adresse laissée telle quelle : {data}")
        return data

    @staticmethod
    def _write(path, data):
        path.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
