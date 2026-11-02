from django.apps import AppConfig


class CoreConfig(AppConfig):
    """Pure-Python routing and risk algorithms. No I/O lives here."""

    name = "stormlane.core"
    label = "core"
