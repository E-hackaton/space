"""Tests du guide (API) et de la génération des voix, sans jamais appeler ElevenLabs pour de vrai."""

import shutil
import tempfile
from io import StringIO
from unittest import mock

from django.core.management import CommandError, call_command
from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework.test import APITestCase

from heroes.models import GuideStep, StoryChapter

from .factories import make_body, make_equipment

FAKE_ENV = {
    "ELEVENLABS_API_KEY": "test-key",
    "ELEVENLABS_VOICE_GUIDE": "voice-guide",
    "ELEVENLABS_VOICE_MACHINE": "voice-machine",
}


class GuideApiTests(APITestCase):
    def setUp(self) -> None:
        GuideStep.objects.create(key="how", order=2, text_fr="Comment.", text_en="How.")
        GuideStep.objects.create(key="welcome", order=1, text_fr="Salut !", text_en="")

    def test_steps_are_ordered_and_localized(self) -> None:
        response = self.client.get(reverse("guide-list"), {"lang": "en"})

        self.assertEqual([step["key"] for step in response.data], ["welcome", "how"])
        self.assertEqual(response.data[1]["text"], "How.")
        self.assertEqual(response.data[0]["text"], "Salut !")  # repli vers le français

    def test_missing_audio_is_null(self) -> None:
        response = self.client.get(reverse("guide-list"))
        self.assertIsNone(response.data[0]["audio"])


class PresentationApiTests(APITestCase):
    def setUp(self) -> None:
        make_equipment(make_body(), kind="rover", tagline_en="I was meant to live 90 days.")

    def test_presentation_is_composed_in_the_requested_language(self) -> None:
        url = reverse("equipment-detail", args=["opportunity"])

        fr = self.client.get(url).json()["presentation"]
        en = self.client.get(url, {"lang": "en"}).json()["presentation"]

        self.assertEqual(fr["title"], "Bonjour, je suis Opportunity.")
        self.assertEqual(fr["body"], "Je suis un rover de la mission MER. Je devais vivre 90 jours.")
        self.assertEqual(en["body"], "I'm a rover from the MER mission. I was meant to live 90 days.")
        self.assertIsNone(fr["audio"])  # pas encore généré : le navigateur lira le texte


class GenerateVoicesTests(TestCase):
    def setUp(self) -> None:
        # Les fichiers audio générés pendant les tests vont dans un dossier temporaire.
        self.media_root = tempfile.mkdtemp()
        self.addCleanup(shutil.rmtree, self.media_root, ignore_errors=True)
        settings_override = override_settings(MEDIA_ROOT=self.media_root)
        settings_override.enable()
        self.addCleanup(settings_override.disable)

        hero = make_equipment(make_body())
        StoryChapter.objects.create(equipment=hero, order=1, title_fr="Un", body_fr="Texte.", title_en="", body_en="")
        GuideStep.objects.create(key="welcome", order=1, text_fr="Salut !", text_en="Hi!")

    def _run(self, *args: str) -> str:
        out = StringIO()
        call_command("generate_voices", *args, stdout=out)
        return out.getvalue()

    def test_dry_run_counts_characters_without_calling_the_api(self) -> None:
        with mock.patch("heroes.services.elevenlabs.synthesize") as synthesize:
            output = self._run("--dry-run")

        synthesize.assert_not_called()
        # 4 textes : guide FR, guide EN, présentation FR, étape FR (rien d'autre n'est traduit en anglais).
        self.assertIn("4 audios à générer", output)
        self.assertIn("opportunity-intro (fr)", output)

    @mock.patch.dict("os.environ", FAKE_ENV)
    def test_generates_once_then_skips_unchanged_texts(self) -> None:
        with mock.patch("heroes.services.elevenlabs.synthesize", return_value=b"ID3-fake-mp3") as synthesize:
            self._run()
            self._run()

        self.assertEqual(synthesize.call_count, 4)  # le second passage ne régénère rien
        self.assertIn(
            mock.call("Bonjour, je suis Opportunity. Je suis un rover de la mission MER. Je devais vivre 90 jours.",
                      "voice-machine", mock.ANY),
            synthesize.call_args_list,
        )
        step = GuideStep.objects.get(key="welcome")
        self.assertTrue(step.audio_fr.name.startswith("voices/guide-welcome-fr-"))
        # La voix du guide et celle des machines sont bien distinctes.
        voices = {call.args[1] for call in synthesize.call_args_list}
        self.assertEqual(voices, {"voice-guide", "voice-machine"})

    @mock.patch.dict("os.environ", FAKE_ENV)
    def test_changed_text_is_regenerated(self) -> None:
        with mock.patch("heroes.services.elevenlabs.synthesize", return_value=b"ID3") as synthesize:
            self._run("--only", "guide", "--lang", "fr")
            GuideStep.objects.filter(key="welcome").update(text_fr="Bonjour !")
            self._run("--only", "guide", "--lang", "fr")

        self.assertEqual(synthesize.call_count, 2)

    def test_missing_configuration_is_a_clear_error(self) -> None:
        with mock.patch.dict("os.environ", {}, clear=True), self.assertRaises(CommandError) as ctx:
            self._run()
        self.assertIn("ELEVENLABS_API_KEY", str(ctx.exception))
