from django.apps import AppConfig


class ApiConfig(AppConfig):
    """HTTP endpoints consumed by the frontend."""

    name = "stormlane.api"
    label = "api"
