"""Tests de la commande load_heroes, sur le vrai fichier de contenu du projet."""

from io import StringIO

from django.core.management import call_command
from django.test import TestCase

from heroes.models import CelestialBody, Equipment


class LoadHeroesCommandTests(TestCase):
    def _load(self, *args: str) -> str:
        out = StringIO()
        call_command("load_heroes", *args, stdout=out)
        return out.getvalue()

    def test_shipped_content_is_valid_and_loads(self) -> None:
        # Si une fiche du JSON est invalide, la commande lève une erreur et le test échoue.
        self._load()

        self.assertEqual(CelestialBody.objects.count(), 3)
        self.assertGreaterEqual(Equipment.objects.count(), 8)
        for equipment in Equipment.objects.all():
            with self.subTest(equipment=equipment.slug):
                self.assertTrue(equipment.chapters.exists(), "chaque héros doit avoir une histoire")
                self.assertTrue(equipment.quiz_questions.exists(), "chaque héros doit avoir un quiz")
                self.assertTrue(equipment.sources.filter(is_nasa=True).exists(), "chaque héros doit citer la NASA")

    def test_existing_equipment_is_not_overwritten_by_default(self) -> None:
        self._load()
        Equipment.objects.filter(slug="opportunity").update(tagline_fr="Modifié dans l'admin")

        self._load()

        self.assertEqual(Equipment.objects.get(slug="opportunity").tagline_fr, "Modifié dans l'admin")

    def test_overwrite_option_restores_file_content(self) -> None:
        self._load()
        Equipment.objects.filter(slug="opportunity").update(tagline_fr="Modifié dans l'admin")

        self._load("--overwrite")

        self.assertNotEqual(Equipment.objects.get(slug="opportunity").tagline_fr, "Modifié dans l'admin")
