"""Règles de validation des modèles (celles qui protègent l'équipe Contenu des erreurs de saisie)."""

from datetime import date

from django.core.exceptions import ValidationError
from django.test import TestCase

from heroes.models import QuizQuestion

from .factories import make_body, make_equipment


class EquipmentValidationTests(TestCase):
    def setUp(self) -> None:
        self.equipment = make_equipment(make_body())

    def test_latitude_without_longitude_is_rejected(self) -> None:
        self.equipment.latitude = 10
        with self.assertRaises(ValidationError) as ctx:
            self.equipment.full_clean()
        self.assertIn("longitude", ctx.exception.message_dict)

    def test_dates_must_be_chronological(self) -> None:
        self.equipment.launch_date = date(2004, 1, 1)
        self.equipment.arrival_date = date(2003, 1, 1)
        with self.assertRaises(ValidationError) as ctx:
            self.equipment.full_clean()
        self.assertIn("last_contact_date", ctx.exception.message_dict)

    def test_mission_end_cannot_precede_arrival(self) -> None:
        self.equipment.arrival_date = date(2021, 2, 18)
        self.equipment.mission_end_date = date(2020, 1, 1)
        with self.assertRaises(ValidationError) as ctx:
            self.equipment.full_clean()
        self.assertIn("mission_end_date", ctx.exception.message_dict)

    def test_nssdca_url_is_built_from_identifier(self) -> None:
        self.equipment.nssdca_id = "2003-032A"
        self.assertTrue(self.equipment.nssdca_url.endswith("id=2003-032A"))

    def test_nssdca_url_is_empty_without_identifier(self) -> None:
        self.assertEqual(self.equipment.nssdca_url, "")


class QuizQuestionValidationTests(TestCase):
    def setUp(self) -> None:
        self.equipment = make_equipment(make_body())

    def _question(self, **overrides: object) -> QuizQuestion:
        fields = {"question_fr": "Question ?", "choices_fr": ["A", "B", "C"], "answer_index": 0}
        fields.update(overrides)
        return QuizQuestion(equipment=self.equipment, **fields)

    def test_valid_question_passes(self) -> None:
        self._question().full_clean()

    def test_answer_index_must_point_to_a_choice(self) -> None:
        with self.assertRaises(ValidationError) as ctx:
            self._question(answer_index=3).full_clean()
        self.assertIn("answer_index", ctx.exception.message_dict)

    def test_choices_must_be_a_short_list_of_texts(self) -> None:
        for invalid in (["Seule réponse"], ["A", "B", "C", "D", "E"], ["A", ""], "A,B"):
            with self.subTest(choices=invalid), self.assertRaises(ValidationError):
                self._question(choices_fr=invalid).full_clean()

    def test_english_choices_must_match_french_count(self) -> None:
        with self.assertRaises(ValidationError) as ctx:
            self._question(choices_en=["A", "B"]).full_clean()
        self.assertIn("choices_en", ctx.exception.message_dict)
