import os

os.environ.setdefault("DJANGO_SECRET_KEY", "test-only-secret-key")
os.environ.setdefault("DJANGO_DEBUG", "true")
os.environ["REDIS_URL"] = ""

from stormlane.settings import *  # noqa: F403

REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"] = {  # noqa: F405
    "plan": "1000/min",
    "heatmap": "1000/min",
    "geocode": "1000/min",
}
