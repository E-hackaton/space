"""Petites fonctions pour créer des données de test lisibles, sans dépendance externe."""

from __future__ import annotations

from typing import Any

from heroes.models import CelestialBody, Equipment


def make_body(slug: str = CelestialBody.Slug.MARS, **overrides: Any) -> CelestialBody:
    defaults: dict[str, Any] = {"name_fr": "Mars", "name_en": "Mars", "order": 1}
    defaults.update(overrides)
    return CelestialBody.objects.create(slug=slug, **defaults)


def make_equipment(body: CelestialBody, slug: str = "opportunity", **overrides: Any) -> Equipment:
    defaults: dict[str, Any] = {
        "name": "Opportunity",
        "mission": "MER",
        "kind": Equipment.Kind.ROVER,
        "status": Equipment.Status.SILENT,
        "tagline_fr": "Je devais vivre 90 jours.",
        "discovery_fr": "De l'eau liquide autrefois.",
    }
    defaults.update(overrides)
    return Equipment.objects.create(body=body, slug=slug, **defaults)
