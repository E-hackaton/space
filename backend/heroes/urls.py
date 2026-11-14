"""Routes de l'API, générées par le routeur DRF."""

from rest_framework.routers import DefaultRouter

from .views import CelestialBodyViewSet, EquipmentViewSet

router = DefaultRouter()
router.register("bodies", CelestialBodyViewSet, basename="body")
router.register("equipment", EquipmentViewSet, basename="equipment")

urlpatterns = router.urls
