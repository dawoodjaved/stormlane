from pathlib import Path
from typing import Any

import environ

BASE_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = BASE_DIR.parent

env = environ.Env(
    DJANGO_DEBUG=(bool, False),
    DJANGO_ALLOWED_HOSTS=(list, ["localhost", "127.0.0.1"]),
    CORS_ALLOWED_ORIGINS=(list, ["http://localhost:5173", "http://127.0.0.1:5173"]),
    CSRF_TRUSTED_ORIGINS=(list, []),
    REDIS_URL=(str, ""),
    HERE_API_KEY=(str, ""),
    OPEN_METEO_BASE_URL=(str, "https://api.open-meteo.com/v1/forecast"),
    LOG_LEVEL=(str, "INFO"),
)

for env_file in (REPO_ROOT / ".env", BASE_DIR / ".env"):
    if env_file.is_file():
        environ.Env.read_env(env_file)

DEBUG: bool = env("DJANGO_DEBUG")
SECRET_KEY: str = env(
    "DJANGO_SECRET_KEY",
    default="django-insecure-local-dev-only" if DEBUG else environ.Env.NOTSET,
)
ALLOWED_HOSTS: list[str] = env("DJANGO_ALLOWED_HOSTS")

INSTALLED_APPS = [
    "django.contrib.contenttypes",
    "django.contrib.auth",
    "corsheaders",
    "rest_framework",
    "stormlane.core",
    "stormlane.routing",
    "stormlane.weather",
    "stormlane.api",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "stormlane.urls"
ASGI_APPLICATION = "stormlane.asgi.application"

TEMPLATES: list[dict[str, Any]] = []

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

REDIS_URL: str = env("REDIS_URL")
CACHES: dict[str, dict[str, Any]] = {
    "default": (
        {
            "BACKEND": "django.core.cache.backends.redis.RedisCache",
            "LOCATION": REDIS_URL,
            "TIMEOUT": 30 * 60,
        }
        if REDIS_URL
        else {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            "LOCATION": "stormlane",
            "TIMEOUT": 30 * 60,
        }
    )
}

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = False
USE_TZ = True

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

CORS_ALLOWED_ORIGINS: list[str] = env("CORS_ALLOWED_ORIGINS")
CSRF_TRUSTED_ORIGINS: list[str] = env("CSRF_TRUSTED_ORIGINS")

REST_FRAMEWORK = {
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
    "DEFAULT_PARSER_CLASSES": ["rest_framework.parsers.JSONParser"],
    "DEFAULT_AUTHENTICATION_CLASSES": [],
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.AllowAny"],
    "UNAUTHENTICATED_USER": None,
}

HERE_API_KEY: str = env("HERE_API_KEY")
OPEN_METEO_BASE_URL: str = env("OPEN_METEO_BASE_URL")

if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "simple": {"format": "%(asctime)s %(levelname)s %(name)s: %(message)s"},
    },
    "handlers": {
        "console": {"class": "logging.StreamHandler", "formatter": "simple"},
    },
    "root": {"handlers": ["console"], "level": env("LOG_LEVEL")},
}
