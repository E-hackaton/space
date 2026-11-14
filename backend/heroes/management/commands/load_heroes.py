"""
Commande `python manage.py load_heroes` : charge le contenu de départ depuis un fichier JSON.

Par défaut, un héros qui existe déjà n'est **pas** modifié. Les corrections faites dans
l'admin par l'équipe Contenu sont ainsi protégées. L'option `--overwrite` force le
remplacement complet (fiche, chapitres, quiz, sources).
"""

from __future__ import annotations

import json
from decimal import Decimal
from pathlib import Path
from typing import Any

from django.core.exceptions import ValidationError
from django.core.management.base import BaseCommand, CommandError, CommandParser
from django.db import transaction

from heroes.models import CelestialBody, Equipment, GuideStep, QuizQuestion, Source, StoryChapter

DEFAULT_DATA_FILE = Path(__file__).resolve().parents[2] / "data" / "heroes.json"

# Clés d'un héros dans le JSON qui ne sont pas des champs directs du modèle Equipment.
NESTED_KEYS = {"body", "chapters", "quiz", "sources"}


class Command(BaseCommand):
    help = "Charge les lieux et les héros depuis un fichier JSON (par défaut heroes/data/heroes.json)."

    def add_arguments(self, parser: CommandParser) -> None:
        parser.add_argument("--file", type=Path, default=DEFAULT_DATA_FILE, help="Chemin du fichier JSON.")
        parser.add_argument(
            "--overwrite",
            action="store_true",
            help="Remplace les héros existants (attention : écrase les modifications faites dans l'admin).",
        )

    def handle(self, *args: Any, **options: Any) -> None:
        data = self._read_json(options["file"])

        # Tout ou rien : si une seule fiche est invalide, la base reste inchangée.
        with transaction.atomic():
            bodies = self._load_bodies(data.get("bodies", []))
            guide_created = self._load_guide(data.get("guide", []), options["overwrite"])
            created, skipped = self._load_equipment(data.get("equipment", []), bodies, options["overwrite"])

        self.stdout.write(
            self.style.SUCCESS(
                f"{len(bodies)} lieux, {guide_created} étapes du guide ajoutées, "
                f"{created} héros chargés, {skipped} déjà présents (ignorés)."
            )
        )

    # --- Étapes ----------------------------------------------------------------

    @staticmethod
    def _read_json(path: Path) -> dict[str, Any]:
        try:
            # parse_float=Decimal : un float binaire ne représente pas exactement -3.0124, et
            # le DecimalField refuserait alors la valeur (trop de chiffres après la virgule).
            return json.loads(path.read_text(encoding="utf-8"), parse_float=Decimal)
        except FileNotFoundError as exc:
            raise CommandError(f"Fichier introuvable : {path}") from exc
        except json.JSONDecodeError as exc:
            raise CommandError(f"JSON invalide dans {path} : {exc}") from exc

    @staticmethod
    def _load_bodies(items: list[dict[str, Any]]) -> dict[str, CelestialBody]:
        """Les lieux sont de simples référentiels : on les met toujours à jour."""
        bodies: dict[str, CelestialBody] = {}
        for item in items:
            fields = {key: value for key, value in item.items() if key != "slug"}
            body, _ = CelestialBody.objects.update_or_create(slug=item["slug"], defaults=fields)
            bodies[body.slug] = body
        return bodies

    @staticmethod
    def _load_guide(items: list[dict[str, Any]], overwrite: bool) -> int:
        """Même règle que les héros : une étape existante n'est remplacée qu'avec --overwrite."""
        created = 0
        for item in items:
            fields = {key: value for key, value in item.items() if key != "key"}
            if overwrite:
                GuideStep.objects.update_or_create(key=item["key"], defaults=fields)
                created += 1
            elif not GuideStep.objects.filter(key=item["key"]).exists():
                GuideStep.objects.create(key=item["key"], **fields)
                created += 1
        return created

    def _load_equipment(
        self,
        items: list[dict[str, Any]],
        bodies: dict[str, CelestialBody],
        overwrite: bool,
    ) -> tuple[int, int]:
        created = skipped = 0
        for item in items:
            slug = item["slug"]
            existing = Equipment.objects.filter(slug=slug).first()
            if existing and not overwrite:
                skipped += 1
                continue
            if existing:
                existing.delete()  # les chapitres, quiz et sources partent en cascade

            body = bodies.get(item["body"]) or CelestialBody.objects.filter(slug=item["body"]).first()
            if body is None:
                raise CommandError(f"« {slug} » : lieu inconnu « {item['body']} ».")

            fields = {key: value for key, value in item.items() if key not in NESTED_KEYS}
            equipment = Equipment(body=body, **fields)
            self._validate(equipment, slug)
            equipment.save()

            self._create_children(equipment, item)
            created += 1
        return created, skipped

    def _create_children(self, equipment: Equipment, item: dict[str, Any]) -> None:
        """Crée chapitres, quiz et sources. L'ordre du JSON devient l'ordre d'affichage."""
        for order, chapter in enumerate(item.get("chapters", []), start=1):
            StoryChapter.objects.create(equipment=equipment, order=order, **chapter)

        for order, question in enumerate(item.get("quiz", []), start=1):
            quiz = QuizQuestion(equipment=equipment, order=order, **question)
            self._validate(quiz, f"{equipment.slug} / quiz {order}")
            quiz.save()

        for source in item.get("sources", []):
            Source.objects.create(equipment=equipment, **source)

    @staticmethod
    def _validate(instance: Equipment | QuizQuestion, label: str) -> None:
        """Applique les mêmes règles que l'admin (full_clean), avec un message d'erreur lisible."""
        try:
            # La contrainte d'unicité est vérifiée par la base ; on évite ici une requête par objet.
            instance.full_clean(validate_unique=False)
        except ValidationError as exc:
            raise CommandError(f"« {label} » invalide : {exc.message_dict}") from exc
