"""
Gestion de la langue des textes renvoyés par l'API.

Le client choisit la langue avec le paramètre `?lang=fr` ou `?lang=en`.
Le français est la langue de référence : c'est la seule dont les champs sont obligatoires.
On s'en sert donc comme repli quand une traduction manque.
"""

from __future__ import annotations

from typing import Any

from rest_framework import serializers
from rest_framework.request import Request

DEFAULT_LANGUAGE = "fr"
SUPPORTED_LANGUAGES = ("fr", "en")


def resolve_language(request: Request | None) -> str:
    """Renvoie la langue demandée si elle est prise en charge, sinon la langue par défaut."""
    if request is None:
        return DEFAULT_LANGUAGE
    requested = request.query_params.get("lang", DEFAULT_LANGUAGE).lower()
    return requested if requested in SUPPORTED_LANGUAGES else DEFAULT_LANGUAGE


class LocalizedField(serializers.Field):
    """
    Champ en lecture seule qui expose `<base>_<langue>` sous le nom `<base>`.

    Exemple : `tagline = LocalizedField("tagline")` renvoie `tagline_en` si `?lang=en`
    et que la traduction existe, sinon `tagline_fr`.
    """

    def __init__(self, base: str, **kwargs: Any) -> None:
        self.base = base
        # source="*" transmet l'objet entier à to_representation, pas un seul attribut.
        super().__init__(source="*", read_only=True, **kwargs)

    def to_representation(self, instance: Any) -> Any:
        language = resolve_language(self.context.get("request"))
        value = getattr(instance, f"{self.base}_{language}", None)
        # Une chaîne ou une liste vide signifie « pas encore traduit ».
        if not value:
            value = getattr(instance, f"{self.base}_{DEFAULT_LANGUAGE}")
        return value


class LocalizedAudioField(serializers.Field):
    """
    URL absolue du fichier audio `<base>_<langue>`, ou null s'il n'existe pas.

    Contrairement aux textes, il n'y a **pas** de repli vers le français : une voix française
    sur une page anglaise serait déroutante. Le frontend utilise alors la voix du navigateur.
    """

    def __init__(self, base: str = "audio", **kwargs: Any) -> None:
        self.base = base
        super().__init__(source="*", read_only=True, **kwargs)

    def to_representation(self, instance: Any) -> str | None:
        return localized_audio_url(instance, self.context.get("request"), self.base)


def localized_audio_url(instance: Any, request: Request | None, base: str = "audio") -> str | None:
    """URL absolue de l'audio dans la langue demandée, ou None (voir LocalizedAudioField)."""
    audio = getattr(instance, f"{base}_{resolve_language(request)}")
    if not audio:
        return None
    return request.build_absolute_uri(audio.url) if request else audio.url
