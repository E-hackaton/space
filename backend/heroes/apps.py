from django.apps import AppConfig


class HeroesConfig(AppConfig):
    """Application métier : les engins abandonnés (« héros »), leurs histoires et leurs quiz."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "heroes"
    verbose_name = "Héros de l'espace"
