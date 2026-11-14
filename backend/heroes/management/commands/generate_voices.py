"""
Commande `python manage.py generate_voices` : génère les voix ElevenLabs des étapes de mission et du guide.

- Ne régénère que les textes qui ont changé (empreinte texte + voix + modèle), pour économiser le quota.
- `--dry-run` compte les caractères à générer sans rien appeler : utile pour vérifier le quota avant.
- Exemples :
    python manage.py generate_voices --dry-run
    python manage.py generate_voices --only guide --lang fr
    python manage.py generate_voices --equipment opportunity ingenuity
"""

from __future__ import annotations

import hashlib
from collections.abc import Iterable
from typing import Any

from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand, CommandError, CommandParser

from heroes.models import Equipment, GuideStep, StoryChapter, VoicedContent
from heroes.services import elevenlabs


def voice_fingerprint(text: str, voice_id: str, model_id: str) -> str:
    """Empreinte de ce qui détermine l'audio : si rien ne change, on garde le fichier existant."""
    return hashlib.sha256(f"{model_id}|{voice_id}|{text}".encode()).hexdigest()


class Command(BaseCommand):
    help = "Génère les voix ElevenLabs (FR/EN) des étapes de mission et du guide."

    def add_arguments(self, parser: CommandParser) -> None:
        parser.add_argument("--lang", nargs="+", choices=VoicedContent.LANGUAGES, default=list(VoicedContent.LANGUAGES))
        parser.add_argument("--only", choices=["guide", "chapters"], help="Limiter au guide ou aux étapes.")
        parser.add_argument("--equipment", nargs="+", metavar="SLUG", help="Limiter à certains héros.")
        parser.add_argument("--force", action="store_true", help="Régénérer même si le texte n'a pas changé.")
        parser.add_argument("--dry-run", action="store_true", help="Compter les caractères sans appeler l'API.")

    def handle(self, *args: Any, **options: Any) -> None:
        items = list(self._select_items(options["only"], options["equipment"]))
        dry_run: bool = options["dry_run"]

        config = None if dry_run else self._load_config()
        generated = skipped = characters = 0

        for item in items:
            for language in options["lang"]:
                text = item.spoken_text(language)
                if not text:
                    continue  # pas encore traduit : rien à lire

                voice_id = config.voice_for(item.voice_role()) if config else item.voice_role()
                fingerprint = voice_fingerprint(text, voice_id, config.model_id if config else "")
                audio_field = getattr(item, f"audio_{language}")
                up_to_date = audio_field and getattr(item, f"audio_{language}_hash") == fingerprint
                if up_to_date and not options["force"]:
                    skipped += 1
                    continue

                characters += len(text)
                generated += 1
                if dry_run:
                    self.stdout.write(f"  [à générer] {item.audio_slug()} ({language}) : {len(text)} caractères")
                    continue

                assert config is not None
                try:
                    audio = elevenlabs.synthesize(text, voice_id, config)
                except elevenlabs.ElevenLabsError as exc:
                    raise CommandError(f"{item.audio_slug()} ({language}) : {exc}") from exc

                # Le nom contient l'empreinte : un nouveau texte ne réutilise jamais un vieux fichier en cache.
                filename = f"{item.audio_slug()}-{language}-{fingerprint[:8]}.mp3"
                if audio_field:
                    audio_field.delete(save=False)
                audio_field.save(filename, ContentFile(audio), save=False)
                setattr(item, f"audio_{language}_hash", fingerprint)
                item.save(update_fields=[f"audio_{language}", f"audio_{language}_hash"])
                self.stdout.write(f"  [généré] {filename}")

        verb = "à générer" if dry_run else "générés"
        self.stdout.write(
            self.style.SUCCESS(f"{generated} audios {verb} · {skipped} déjà à jour · {characters} caractères.")
        )

    @staticmethod
    def _select_items(only: str | None, equipment: list[str] | None) -> Iterable[VoicedContent]:
        if only != "chapters" and not equipment:
            yield from GuideStep.objects.all()
        if only != "guide":
            # Pour chaque machine : sa présentation (« Bonjour, je suis… »), puis les étapes de sa mission.
            heroes = Equipment.objects.filter(is_published=True)
            chapters = StoryChapter.objects.select_related("equipment").filter(equipment__is_published=True)
            if equipment:
                heroes = heroes.filter(slug__in=equipment)
                chapters = chapters.filter(equipment__slug__in=equipment)
            yield from heroes
            yield from chapters

    @staticmethod
    def _load_config() -> elevenlabs.VoiceConfig:
        try:
            return elevenlabs.VoiceConfig.from_env()
        except elevenlabs.ElevenLabsError as exc:
            raise CommandError(str(exc)) from exc
