"""Tests de l'export statique de l'API (repli du site quand Django ne répond pas)."""

import json
import shutil
import tempfile
from io import StringIO
from pathlib import Path

from django.core.files.base import ContentFile
from django.core.management import call_command
from django.test import TestCase, override_settings

from heroes.models import StoryChapter

from .factories import make_body, make_equipment


class ExportStaticApiTests(TestCase):
    def setUp(self) -> None:
        # Médias et sortie dans des dossiers temporaires : le vrai frontend n'est jamais touché.
        self.media_root = tempfile.mkdtemp()
        self.public = Path(tempfile.mkdtemp())
        self.addCleanup(shutil.rmtree, self.media_root, ignore_errors=True)
        self.addCleanup(shutil.rmtree, self.public, ignore_errors=True)
        override = override_settings(MEDIA_ROOT=self.media_root)
        override.enable()
        self.addCleanup(override.disable)

        hero = make_equipment(make_body())
        self.chapter = StoryChapter.objects.create(equipment=hero, order=1, title_fr="Un", body_fr="Texte.", title_en="", body_en="")
        self.chapter.audio_fr.save("chap-fr.mp3", ContentFile(b"ID3-fake-mp3"))

    def _export(self) -> Path:
        out = self.public / "data" / "api"
        call_command("export_static_api", "--out", str(out), stdout=StringIO(), stderr=StringIO())
        return out

    def test_exports_list_and_details_in_both_languages(self) -> None:
        out = self._export()
        self.assertTrue((out / "equipment-fr.json").is_file())
        self.assertTrue((out / "equipment-en.json").is_file())
        self.assertTrue((out / "equipment" / "opportunity-fr.json").is_file())
        self.assertTrue((out / "equipment" / "opportunity-en.json").is_file())

    def test_copies_voices_and_rewrites_their_urls(self) -> None:
        out = self._export()
        detail = json.loads((out / "equipment" / "opportunity-fr.json").read_text(encoding="utf-8"))
        audio = detail["chapters"][0]["audio"]
        # L'adresse pointe vers la copie statique, servie par le frontend sans Django.
        self.assertEqual(audio, f"/static-media/{self.chapter.audio_fr.name}")
        copy = self.public / "static-media" / self.chapter.audio_fr.name
        self.assertEqual(copy.read_bytes(), b"ID3-fake-mp3")

    def test_old_copies_are_removed(self) -> None:
        stale = self.public / "static-media" / "voices" / "old.mp3"
        stale.parent.mkdir(parents=True)
        stale.write_bytes(b"old")
        self._export()
        self.assertFalse(stale.exists())
