"""
Sérialiseurs de l'API publique (lecture seule).

Les champs bilingues de la base (`xxx_fr` / `xxx_en`) sont exposés sous un nom unique (`xxx`)
dans la langue demandée : le frontend n'a jamais à gérer le choix de langue champ par champ.
"""

from rest_framework import serializers

from .i18n import LocalizedAudioField, LocalizedField, localized_audio_url, resolve_language
from .models import CelestialBody, Equipment, GuideStep, QuizQuestion, Source, StoryChapter


class CelestialBodySerializer(serializers.ModelSerializer):
    """Un lieu de l'Atlas, avec le nombre de héros publiés qu'il contient."""

    name = LocalizedField("name")
    intro = LocalizedField("intro")
    # Ce champ est calculé par une annotation SQL dans la vue, pour éviter une requête par lieu.
    equipment_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = CelestialBody
        fields = ["slug", "name", "intro", "map_image", "map_credit", "equipment_count"]


class StoryChapterSerializer(serializers.ModelSerializer):
    """Étape datée de la mission. `focus` dit au frontend quelle pièce de la machine 3D montrer."""

    title = LocalizedField("title")
    body = LocalizedField("body")
    audio = LocalizedAudioField()

    class Meta:
        model = StoryChapter
        fields = ["order", "phase", "date", "date_precision", "focus", "title", "body", "audio"]


class GuideStepSerializer(serializers.ModelSerializer):
    text = LocalizedField("text")
    audio = LocalizedAudioField()

    class Meta:
        model = GuideStep
        fields = ["key", "order", "text", "audio"]


class QuizQuestionSerializer(serializers.ModelSerializer):
    """
    La bonne réponse est envoyée au client.

    C'est un choix assumé : le quiz est un jeu éducatif sans enjeu, et corriger côté client
    donne un retour immédiat à l'élève, sans aller-retour réseau.
    """

    question = LocalizedField("question")
    choices = LocalizedField("choices")
    explanation = LocalizedField("explanation")

    class Meta:
        model = QuizQuestion
        fields = ["id", "question", "choices", "answer_index", "explanation"]


class SourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Source
        fields = ["label", "url", "is_nasa"]


class EquipmentListSerializer(serializers.ModelSerializer):
    """Version légère d'un héros, suffisante pour l'Atlas (marqueurs et vignettes)."""

    body = serializers.SlugRelatedField(slug_field="slug", read_only=True)
    location = LocalizedField("location")
    tagline = LocalizedField("tagline")

    class Meta:
        model = Equipment
        fields = [
            "slug",
            "name",
            "mission",
            "body",
            "kind",
            "status",
            "latitude",
            "longitude",
            "location",
            "tagline",
            "image",
            "image_credit",
            "launch_date",
            "arrival_date",
            "last_contact_date",
            "mission_end_date",
        ]


class EquipmentDetailSerializer(EquipmentListSerializer):
    """Fiche complète d'un héros : histoire, quiz et sources."""

    discovery = LocalizedField("discovery")
    status_note = LocalizedField("status_note")
    nssdca_url = serializers.CharField(read_only=True)
    # Première étape de la visite : la machine se présente, avec sa voix ElevenLabs si elle existe.
    presentation = serializers.SerializerMethodField()
    chapters = StoryChapterSerializer(many=True, read_only=True)
    quiz = QuizQuestionSerializer(source="quiz_questions", many=True, read_only=True)
    sources = SourceSerializer(many=True, read_only=True)

    class Meta(EquipmentListSerializer.Meta):
        fields = [
            *EquipmentListSerializer.Meta.fields,
            "nssdca_id",
            "nssdca_url",
            "discovery",
            "status_note",
            "presentation",
            "chapters",
            "quiz",
            "sources",
        ]

    def get_presentation(self, hero: Equipment) -> dict[str, str | None]:
        request = self.context.get("request")
        title, body = hero.presentation(resolve_language(request))
        return {"title": title, "body": body, "audio": localized_audio_url(hero, request)}
