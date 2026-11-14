"""Routes racines du projet : admin, API REST et, en développement, fichiers médias."""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

admin.site.site_header = "Sankofa : administration du contenu"
admin.site.site_title = "Sankofa admin"
admin.site.index_title = "Héros, histoires et quiz"

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("heroes.urls")),
]

# En production, les médias sont servis par l'hébergeur, pas par Django.
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
