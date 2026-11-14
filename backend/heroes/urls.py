"""Routes de l'API, générées par le routeur DRF."""

from rest_framework.routers import DefaultRouter

from .views import CelestialBodyViewSet, EquipmentViewSet, GuideStepViewSet

router = DefaultRouter()
router.register("bodies", CelestialBodyViewSet, basename="body")
router.register("equipment", EquipmentViewSet, basename="equipment")
router.register("guide", GuideStepViewSet, basename="guide")

urlpatterns = router.urls
