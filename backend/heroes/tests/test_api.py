"""Tests de l'API publique : routes, filtres, langue et visibilité des brouillons."""

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from heroes.models import CelestialBody, Equipment, QuizQuestion, StoryChapter

from .factories import make_body, make_equipment


class CelestialBodyApiTests(APITestCase):
    def test_list_counts_only_published_equipment(self) -> None:
        mars = make_body()
        make_equipment(mars, slug="visible")
        make_equipment(mars, slug="draft", is_published=False)

        response = self.client.get(reverse("body-list"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]["equipment_count"], 1)

    def test_list_follows_display_order(self) -> None:
        make_body(CelestialBody.Slug.ELSEWHERE, name_fr="Ailleurs", order=3)
        make_body(CelestialBody.Slug.MOON, name_fr="Lune", order=1)
        make_body(CelestialBody.Slug.MARS, order=2)

        response = self.client.get(reverse("body-list"))

        self.assertEqual([body["slug"] for body in response.data], ["moon", "mars", "elsewhere"])


class EquipmentApiTests(APITestCase):
    def setUp(self) -> None:
        self.mars = make_body()
        self.moon = make_body(CelestialBody.Slug.MOON, name_fr="Lune", name_en="Moon", order=0)
        self.rover = make_equipment(self.mars, tagline_en="I was built to last 90 days.")
        make_equipment(self.moon, slug="surveyor-3", name="Surveyor 3", status=Equipment.Status.SILENT)

    def test_list_returns_published_equipment(self) -> None:
        make_equipment(self.mars, slug="hidden", is_published=False)

        response = self.client.get(reverse("equipment-list"))

        slugs = {item["slug"] for item in response.data}
        self.assertEqual(slugs, {"opportunity", "surveyor-3"})

    def test_list_can_be_filtered_by_body(self) -> None:
        response = self.client.get(reverse("equipment-list"), {"body": "moon"})
        self.assertEqual([item["slug"] for item in response.data], ["surveyor-3"])

    def test_unknown_filter_value_returns_400(self) -> None:
        response = self.client.get(reverse("equipment-list"), {"status": "sleeping"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_detail_includes_ordered_chapters_and_quiz(self) -> None:
        StoryChapter.objects.create(equipment=self.rover, order=2, title_fr="Deux", body_fr="…")
        StoryChapter.objects.create(equipment=self.rover, order=1, title_fr="Un", body_fr="…")
        QuizQuestion.objects.create(equipment=self.rover, question_fr="Q ?", choices_fr=["A", "B"], answer_index=1)

        response = self.client.get(reverse("equipment-detail", args=["opportunity"]))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual([c["title"] for c in response.data["chapters"]], ["Un", "Deux"])
        self.assertEqual(response.data["quiz"][0]["choices"], ["A", "B"])

    def test_draft_detail_is_not_found(self) -> None:
        make_equipment(self.mars, slug="draft", is_published=False)
        response = self.client.get(reverse("equipment-detail", args=["draft"]))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_english_is_returned_when_available(self) -> None:
        response = self.client.get(reverse("equipment-detail", args=["opportunity"]), {"lang": "en"})
        self.assertEqual(response.data["tagline"], "I was built to last 90 days.")

    def test_french_is_used_as_fallback(self) -> None:
        response = self.client.get(reverse("equipment-detail", args=["opportunity"]), {"lang": "en"})
        # discovery_en est vide : l'API renvoie le texte français.
        self.assertEqual(response.data["discovery"], "De l'eau liquide autrefois.")

    def test_coordinates_are_numbers(self) -> None:
        self.rover.latitude, self.rover.longitude = -2.28, -5.43
        self.rover.save()
        response = self.client.get(reverse("equipment-detail", args=["opportunity"]))
        # On vérifie le JSON réellement envoyé, pas l'objet Python intermédiaire.
        self.assertIsInstance(response.json()["latitude"], float)
