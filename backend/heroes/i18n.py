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
