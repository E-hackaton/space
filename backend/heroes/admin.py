"""
Administration Django : c'est l'outil de l'équipe Contenu.

Tout le contenu d'un héros (fiche, chapitres, quiz, sources) se modifie sur une seule page,
grâce aux formulaires en ligne (inlines).
"""

from django.contrib import admin

from .models import CelestialBody, Equipment, QuizQuestion, Source, StoryChapter


@admin.register(CelestialBody)
class CelestialBodyAdmin(admin.ModelAdmin):
    list_display = ["name_fr", "slug", "order"]
    list_editable = ["order"]


class StoryChapterInline(admin.StackedInline):
    model = StoryChapter
    extra = 0
    fields = ["order", "title_fr", "body_fr", "title_en", "body_en"]


class QuizQuestionInline(admin.StackedInline):
    model = QuizQuestion
    extra = 0
    fields = [
        "order",
        "question_fr",
        "choices_fr",
        "answer_index",
        "explanation_fr",
        "question_en",
        "choices_en",
        "explanation_en",
    ]


class SourceInline(admin.TabularInline):
    model = Source
    extra = 0


@admin.register(Equipment)
class EquipmentAdmin(admin.ModelAdmin):
    list_display = ["name", "mission", "body", "kind", "status", "order", "is_published"]
    list_editable = ["order", "is_published"]
    list_filter = ["body", "status", "kind", "is_published"]
    search_fields = ["name", "mission", "nssdca_id"]
    prepopulated_fields = {"slug": ["name"]}
    inlines = [StoryChapterInline, QuizQuestionInline, SourceInline]

    # Les sections suivent l'ordre dans lequel on remplit une fiche.
    fieldsets = [
        ("Identité", {"fields": ["name", "slug", "mission", "body", "kind", "status", "is_published", "order"]}),
        (
            "Repères NASA",
            {"fields": ["nssdca_id", "launch_date", "arrival_date", "last_contact_date", "mission_end_date"]},
        ),
        ("Position", {"fields": ["latitude", "longitude", "location_fr", "location_en"]}),
        (
            "Textes pour les élèves",
            {"fields": ["tagline_fr", "discovery_fr", "status_note_fr", "tagline_en", "discovery_en", "status_note_en"]},
        ),
        ("Illustration", {"fields": ["image", "image_credit"]}),
    ]
