import os

os.environ.setdefault("DJANGO_SECRET_KEY", "test-only-secret-key")
os.environ["REDIS_URL"] = ""

from stormlane.settings import *  # noqa: F403
