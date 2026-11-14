"""Vues de l'API REST, toutes en lecture seule."""

from django.db.models import Count, Prefetch, Q, QuerySet
from rest_framework import viewsets
from rest_framework.exceptions import ValidationError

from .models import CelestialBody, Equipment, GuideStep, QuizQuestion, StoryChapter
from .serializers import (
    CelestialBodySerializer,
    EquipmentDetailSerializer,
    EquipmentListSerializer,
    GuideStepSerializer,
)


class GuideStepViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Le script de la visite d'accueil de Sankofa.

    - `GET /api/guide/` : les étapes dans l'ordre, avec leur audio dans la langue demandée
    """

    serializer_class = GuideStepSerializer
    queryset = GuideStep.objects.all()
    lookup_field = "key"


class CelestialBodyViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Les lieux de l'Atlas.

    - `GET /api/bodies/` : la liste des lieux
    - `GET /api/bodies/<slug>/` : un lieu
    """

    serializer_class = CelestialBodySerializer
    lookup_field = "slug"

    def get_queryset(self) -> QuerySet[CelestialBody]:
        # On ne compte que les héros publiés : un brouillon ne doit pas apparaître dans les compteurs.
        # Le tri est explicite, car Django ignore Meta.ordering dans les requêtes avec agrégat (GROUP BY).
        return CelestialBody.objects.annotate(
            equipment_count=Count("equipment", filter=Q(equipment__is_published=True))
        ).order_by("order", "slug")


class EquipmentViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Les héros publiés.

    - `GET /api/equipment/` : la liste, filtrable par `?body=mars` et `?status=silent`
    - `GET /api/equipment/<slug>/` : la fiche complète (chapitres, quiz, sources)

    Tous les textes acceptent `?lang=fr|en`.
    """

    lookup_field = "slug"

    def get_serializer_class(self):
        return EquipmentDetailSerializer if self.action == "retrieve" else EquipmentListSerializer

    def get_queryset(self) -> QuerySet[Equipment]:
        queryset = Equipment.objects.filter(is_published=True).select_related("body")

        if self.action == "retrieve":
            # Une requête par relation au lieu d'une requête par élément (problème N+1).
            return queryset.prefetch_related(
                Prefetch("chapters", queryset=StoryChapter.objects.order_by("order")),
                Prefetch("quiz_questions", queryset=QuizQuestion.objects.order_by("order")),
                "sources",
            )

        return self._apply_filters(queryset)

    def _apply_filters(self, queryset: QuerySet[Equipment]) -> QuerySet[Equipment]:
        """Applique les filtres de la liste et refuse les valeurs inconnues (réponse 400)."""
        params = self.request.query_params

        body = params.get("body")
        if body:
            if body not in CelestialBody.Slug.values:
                raise ValidationError({"body": f"Valeurs possibles : {', '.join(CelestialBody.Slug.values)}."})
            queryset = queryset.filter(body__slug=body)

        status = params.get("status")
        if status:
            if status not in Equipment.Status.values:
                raise ValidationError({"status": f"Valeurs possibles : {', '.join(Equipment.Status.values)}."})
            queryset = queryset.filter(status=status)

        return queryset
