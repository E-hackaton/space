"""
Modèle de données de Sankofa.

Un **lieu** (CelestialBody : Lune, Mars, Ailleurs) accueille des **héros** (Equipment),
c'est-à-dire des engins laissés par la NASA. Chaque héros a :
- des **chapitres** d'histoire racontés à la première personne (StoryChapter) ;
- des **questions de quiz** (QuizQuestion) ;
- des **sources** pour garantir la validité scientifique (Source).

Les textes destinés aux élèves existent en français (`_fr`, obligatoire) et en anglais
(`_en`, facultatif). Si la traduction anglaise manque, l'API renvoie le français.
"""

from __future__ import annotations

from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class CelestialBody(models.Model):
    """Un lieu de l'Atlas : la Lune, Mars ou « Ailleurs » (astéroïdes, espace lointain)."""

    class Slug(models.TextChoices):
        MOON = "moon", "Lune"
        MARS = "mars", "Mars"
        ELSEWHERE = "elsewhere", "Ailleurs"

    slug = models.SlugField(unique=True, choices=Slug.choices)
    name_fr = models.CharField("nom (FR)", max_length=60)
    name_en = models.CharField("nom (EN)", max_length=60, blank=True)
    intro_fr = models.TextField("présentation par Sankofa (FR)", blank=True)
    intro_en = models.TextField("présentation par Sankofa (EN)", blank=True)
    # Carte en projection équirectangulaire : x = longitude, y = latitude.
    # Ce choix permet de placer les marqueurs par un simple calcul de proportion.
    map_image = models.ImageField("carte équirectangulaire", upload_to="maps/", blank=True)
    map_credit = models.CharField("crédit de la carte", max_length=200, blank=True)
    order = models.PositiveSmallIntegerField("ordre d'affichage", default=0)

    class Meta:
        ordering = ["order", "slug"]
        verbose_name = "lieu"
        verbose_name_plural = "lieux"

    def __str__(self) -> str:
        return self.name_fr


class Equipment(models.Model):
    """Un « héros » : un engin de la NASA laissé sur la Lune, sur Mars ou ailleurs."""

    class Kind(models.TextChoices):
        LANDER = "lander", "Atterrisseur"
        DESCENT_STAGE = "descent_stage", "Étage de descente"
        ROVER = "rover", "Rover"
        HELICOPTER = "helicopter", "Hélicoptère"
        INSTRUMENT = "instrument", "Instrument scientifique"
        ORBITER = "orbiter", "Sonde en orbite"
        PROBE = "probe", "Sonde interplanétaire"
        TELESCOPE = "telescope", "Télescope spatial"

    class Status(models.TextChoices):
        """Niveau de fonctionnement actuel, au cœur de l'énoncé du défi."""

        ACTIVE = "active", "Encore actif"
        USEFUL = "useful", "Encore utile"
        SILENT = "silent", "Silencieux"
        LOST = "lost", "Perdu"

    slug = models.SlugField(unique=True, help_text="Identifiant dans l'URL, ex. « opportunity ».")
    name = models.CharField("nom", max_length=80)
    mission = models.CharField("mission", max_length=80, help_text="Ex. « Apollo 11 », « Mars 2020 ».")
    body = models.ForeignKey(
        CelestialBody,
        on_delete=models.PROTECT,  # on ne supprime pas un lieu qui contient encore des héros
        related_name="equipment",
        verbose_name="lieu",
    )
    kind = models.CharField("type", max_length=20, choices=Kind.choices)
    status = models.CharField("état actuel", max_length=10, choices=Status.choices)

    # Identifiant NASA (NSSDCA), ex. « 1969-059C ». Il sert à générer le lien vers le catalogue officiel.
    nssdca_id = models.CharField("identifiant NSSDCA", max_length=20, blank=True)

    launch_date = models.DateField("date de lancement", null=True, blank=True)
    arrival_date = models.DateField("date d'arrivée", null=True, blank=True)
    last_contact_date = models.DateField("dernier contact", null=True, blank=True)

    # Coordonnées planétocentriques, longitude Est positive (entre -180 et 180).
    # Elles restent vides pour les engins qui ne sont pas posés sur la Lune ou sur Mars.
    latitude = models.DecimalField(
        max_digits=8,
        decimal_places=4,
        null=True,
        blank=True,
        validators=[MinValueValidator(-90), MaxValueValidator(90)],
    )
    longitude = models.DecimalField(
        max_digits=8,
        decimal_places=4,
        null=True,
        blank=True,
        validators=[MinValueValidator(-180), MaxValueValidator(180)],
    )
    location_fr = models.CharField("lieu de repos (FR)", max_length=160, blank=True)
    location_en = models.CharField("lieu de repos (EN)", max_length=160, blank=True)

    tagline_fr = models.CharField("accroche (FR)", max_length=200)
    tagline_en = models.CharField("accroche (EN)", max_length=200, blank=True)
    discovery_fr = models.TextField("découverte clé (FR)")
    discovery_en = models.TextField("découverte clé (EN)", blank=True)
    status_note_fr = models.TextField("ce que je deviens (FR)", blank=True)
    status_note_en = models.TextField("ce que je deviens (EN)", blank=True)

    image = models.ImageField("photo", upload_to="equipment/", blank=True)
    image_credit = models.CharField("crédit photo", max_length=200, blank=True)

    order = models.PositiveSmallIntegerField("ordre d'affichage", default=0)
    is_published = models.BooleanField(
        "publié",
        default=True,
        help_text="Décocher pour cacher un héros dont la fiche n'est pas encore validée.",
    )

    class Meta:
        ordering = ["body__order", "order", "name"]
        verbose_name = "héros"
        verbose_name_plural = "héros"

    def __str__(self) -> str:
        return f"{self.name} ({self.mission})"

    @property
    def has_coordinates(self) -> bool:
        """Vrai si l'engin peut être placé sur une carte."""
        return self.latitude is not None and self.longitude is not None

    @property
    def nssdca_url(self) -> str:
        """Lien vers la fiche officielle de l'engin dans le catalogue NASA NSSDCA."""
        if not self.nssdca_id:
            return ""
        return f"https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id={self.nssdca_id}"

    def clean(self) -> None:
        """Vérifie la cohérence des données avant l'enregistrement depuis l'admin."""
        super().clean()
        errors: dict[str, str] = {}

        # Une position n'a de sens que complète.
        if (self.latitude is None) != (self.longitude is None):
            errors["longitude"] = "Latitude et longitude doivent être renseignées ensemble."

        # Les dates doivent suivre l'ordre chronologique de la mission.
        dates = [self.launch_date, self.arrival_date, self.last_contact_date]
        known = [d for d in dates if d is not None]
        if known != sorted(known):
            errors["last_contact_date"] = "Les dates doivent suivre l'ordre : lancement ≤ arrivée ≤ dernier contact."

        if errors:
            raise ValidationError(errors)


class StoryChapter(models.Model):
    """Un chapitre de l'histoire d'un héros, raconté à la première personne."""

    equipment = models.ForeignKey(
        Equipment, on_delete=models.CASCADE, related_name="chapters", verbose_name="héros"
    )
    order = models.PositiveSmallIntegerField("ordre", default=0)
    title_fr = models.CharField("titre (FR)", max_length=120)
    title_en = models.CharField("titre (EN)", max_length=120, blank=True)
    body_fr = models.TextField("texte (FR)")
    body_en = models.TextField("texte (EN)", blank=True)

    class Meta:
        ordering = ["equipment", "order"]
        verbose_name = "chapitre"
        verbose_name_plural = "chapitres"
        constraints = [
            models.UniqueConstraint(fields=["equipment", "order"], name="unique_chapter_order"),
        ]

    def __str__(self) -> str:
        return f"{self.equipment.name} · {self.order}. {self.title_fr}"


class QuizQuestion(models.Model):
    """Une question à choix multiples. La réussir aide à débloquer la carte du héros."""

    MIN_CHOICES = 2
    MAX_CHOICES = 4

    equipment = models.ForeignKey(
        Equipment, on_delete=models.CASCADE, related_name="quiz_questions", verbose_name="héros"
    )
    order = models.PositiveSmallIntegerField("ordre", default=0)
    question_fr = models.CharField("question (FR)", max_length=300)
    question_en = models.CharField("question (EN)", max_length=300, blank=True)
    # Listes de chaînes, ex. ["1969", "1975", "1981"].
    choices_fr = models.JSONField("réponses possibles (FR)", default=list)
    choices_en = models.JSONField("réponses possibles (EN)", default=list, blank=True)
    answer_index = models.PositiveSmallIntegerField("index de la bonne réponse (0 = la première)")
    explanation_fr = models.TextField("explication (FR)", blank=True)
    explanation_en = models.TextField("explication (EN)", blank=True)

    class Meta:
        ordering = ["equipment", "order"]
        verbose_name = "question de quiz"
        verbose_name_plural = "questions de quiz"

    def __str__(self) -> str:
        return f"{self.equipment.name} · {self.question_fr}"

    def clean(self) -> None:
        """Le JSONField accepte n'importe quoi : on valide ici la forme attendue."""
        super().clean()
        errors: dict[str, str] = {}

        if not self._is_valid_choice_list(self.choices_fr):
            errors["choices_fr"] = (
                f"Il faut une liste de {self.MIN_CHOICES} à {self.MAX_CHOICES} réponses (texte non vide)."
            )
        elif self.answer_index >= len(self.choices_fr):
            errors["answer_index"] = "L'index de la bonne réponse dépasse le nombre de réponses."

        if self.choices_en:
            if not self._is_valid_choice_list(self.choices_en):
                errors["choices_en"] = "Format invalide : même règle que pour le français."
            elif isinstance(self.choices_fr, list) and len(self.choices_en) != len(self.choices_fr):
                errors["choices_en"] = "Il faut autant de réponses en anglais qu'en français."

        if errors:
            raise ValidationError(errors)

    @classmethod
    def _is_valid_choice_list(cls, value: object) -> bool:
        return (
            isinstance(value, list)
            and cls.MIN_CHOICES <= len(value) <= cls.MAX_CHOICES
            and all(isinstance(choice, str) and choice.strip() for choice in value)
        )


class Source(models.Model):
    """Une référence qui justifie les faits d'une fiche (exigence « Accuracy » du défi)."""

    equipment = models.ForeignKey(
        Equipment, on_delete=models.CASCADE, related_name="sources", verbose_name="héros"
    )
    label = models.CharField("libellé", max_length=200)
    url = models.URLField("lien", max_length=500)
    # Permet de lister facilement les données NASA dans le formulaire de soumission.
    is_nasa = models.BooleanField("ressource NASA", default=True)

    class Meta:
        ordering = ["equipment", "-is_nasa", "label"]
        verbose_name = "source"
        verbose_name_plural = "sources"

    def __str__(self) -> str:
        return self.label
