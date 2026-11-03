from django.urls import path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from weighcast.api import views

app_name = "api"

urlpatterns = [
    path("health", views.health, name="health"),
    path("plan", views.PlanView.as_view(), name="plan"),
    path("heatmap", views.HeatmapView.as_view(), name="heatmap"),
    path("geocode", views.GeocodeView.as_view(), name="geocode"),
    path("schema", SpectacularAPIView.as_view(), name="schema"),
    path("docs", SpectacularSwaggerView.as_view(url_name="api:schema"), name="docs"),
]
