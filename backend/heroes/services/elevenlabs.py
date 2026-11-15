"""
Client minimal de l'API de synthèse vocale ElevenLabs.

Volontairement sans dépendance (urllib de la bibliothèque standard) : on n'appelle qu'une route.
La clé API est lue côté serveur uniquement : elle ne doit jamais arriver dans le navigateur.
Documentation : https://elevenlabs.io/docs/api-reference/text-to-speech
"""

from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from dataclasses import dataclass

API_URL = "https://api.elevenlabs.io/v1/text-to-speech/{voice_id}?output_format=mp3_44100_128"
# Modèle multilingue : la même voix parle français et anglais.
DEFAULT_MODEL = "eleven_multilingual_v2"
REQUEST_TIMEOUT_S = 60


class ElevenLabsError(Exception):
    """Erreur renvoyée par l'API, avec un message lisible (quota, clé invalide…)."""


@dataclass(frozen=True)
class VoiceConfig:
    """Configuration lue dans l'environnement (fichier .env)."""

    api_key: str
    guide_voice_id: str
    machine_voice_id: str
    model_id: str = DEFAULT_MODEL
    # Voix par langue (facultatives) : si l'une est définie, elle sert pour tous les textes de cette langue.
    voices_by_language: tuple[tuple[str, str], ...] = ()

    @classmethod
    def from_env(cls) -> VoiceConfig:
        by_language = tuple((lang, os.environ[f"ELEVENLABS_VOICE_{lang.upper()}"]) for lang in ("fr", "en") if os.environ.get(f"ELEVENLABS_VOICE_{lang.upper()}"))
        # Voix par rôle obligatoires, sauf si chaque langue a sa propre voix.
        required = ["ELEVENLABS_API_KEY"] + ([] if len(by_language) == 2 else ["ELEVENLABS_VOICE_GUIDE", "ELEVENLABS_VOICE_MACHINE"])
        missing = [name for name in required if not os.environ.get(name)]
        if missing:
            raise ElevenLabsError(f"Variables d'environnement manquantes : {', '.join(missing)}.")
        return cls(
            api_key=os.environ["ELEVENLABS_API_KEY"],
            guide_voice_id=os.environ.get("ELEVENLABS_VOICE_GUIDE", ""),
            machine_voice_id=os.environ.get("ELEVENLABS_VOICE_MACHINE", ""),
            model_id=os.environ.get("ELEVENLABS_MODEL", DEFAULT_MODEL),
            voices_by_language=by_language,
        )

    def voice_for(self, role: str, language: str | None = None) -> str:
        by_language = dict(self.voices_by_language)
        if language and by_language.get(language):
            return by_language[language]
        return self.guide_voice_id if role == "guide" else self.machine_voice_id


def synthesize(text: str, voice_id: str, config: VoiceConfig) -> bytes:
    """Transforme un texte en MP3. Lève ElevenLabsError en cas d'échec."""
    payload = json.dumps(
        {
            "text": text,
            "model_id": config.model_id,
            # Stabilité moyenne : une voix vivante mais régulière, adaptée à la narration.
            "voice_settings": {"stability": 0.5, "similarity_boost": 0.75},
        }
    ).encode("utf-8")
    request = urllib.request.Request(
        API_URL.format(voice_id=voice_id),
        data=payload,
        method="POST",
        headers={"xi-api-key": config.api_key, "Content-Type": "application/json", "Accept": "audio/mpeg"},
    )
    try:
        with urllib.request.urlopen(request, timeout=REQUEST_TIMEOUT_S) as response:
            return response.read()
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")[:300]
        raise ElevenLabsError(f"ElevenLabs a répondu {exc.code} : {detail}") from exc
    except urllib.error.URLError as exc:
        raise ElevenLabsError(f"ElevenLabs injoignable : {exc.reason}") from exc
