import os
from datetime import timedelta
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

def env_list(name, default=""):
    return [x.strip() for x in os.getenv(name, default).split(",") if x.strip()]


DEBUG = os.getenv("DJANGO_DEBUG", "0").lower() in ("1", "true", "yes")
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "dev-secret" if DEBUG else "")
if not SECRET_KEY:
    raise RuntimeError("DJANGO_SECRET_KEY не задан. Добавьте его в переменные окружения.")

ALLOWED_HOSTS = env_list("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1")
# Render сам сообщает адрес сервиса (…onrender.com) — добавляем его автоматически
RENDER_HOST = os.getenv("RENDER_EXTERNAL_HOSTNAME")
if RENDER_HOST:
    ALLOWED_HOSTS.append(RENDER_HOST)

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "storages",
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",
    "django_filters",
    "apps.events",
    "apps.participants",
    "apps.payments",
    "apps.tasks",
    "apps.schedule",
    "apps.documents",
    "apps.badges",
    "apps.wall",
    
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",  # статика админки в проде
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [{
    "BACKEND": "django.template.backends.django.DjangoTemplates",
    "DIRS": [],
    "APP_DIRS": True,
    "OPTIONS": {"context_processors": [
        "django.template.context_processors.request",
        "django.contrib.auth.context_processors.auth",
        "django.contrib.messages.context_processors.messages",
    ]},
}]

WSGI_APPLICATION = "config.wsgi.application"

if os.getenv("DB_HOST"):
    # Supabase PostgreSQL (основной вариант)
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.getenv("DB_NAME", "postgres"),
            "USER": os.getenv("DB_USER"),
            "PASSWORD": os.getenv("DB_PASSWORD"),
            "HOST": os.getenv("DB_HOST"),
            "PORT": os.getenv("DB_PORT", "5432"),
            "OPTIONS": {"sslmode": os.getenv("DB_SSLMODE", "require")},
        }
    }
else:
    # Локальная разработка без интернета: если DB_HOST не задан — SQLite
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

AUTH_USER_MODEL = "auth.User"

LANGUAGE_CODE = "ru"
LANGUAGES = [("ru", "Русский"), ("en", "English"), ("ky", "Кыргызча")]
TIME_ZONE = os.getenv("DJANGO_TIME_ZONE", "Asia/Bishkek")
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    
    "DEFAULT_PERMISSION_CLASSES": ("apps.participants.access.IsStaff",),
    "DEFAULT_FILTER_BACKENDS": ("django_filters.rest_framework.DjangoFilterBackend",),
    # Защита публичной стены от спама: не больше 20 поздравлений в час с одного адреса
    "DEFAULT_THROTTLE_RATES": {"wall": "20/hour"},
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(hours=8),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=14),
}

# Адреса фронтенда, которым можно обращаться к API (через запятую)
CORS_ALLOWED_ORIGINS = env_list("FRONTEND_URL", "http://localhost:5173") + ["http://127.0.0.1:5173"]
CSRF_TRUSTED_ORIGINS = [f"https://{RENDER_HOST}"] if RENDER_HOST else []

if not DEBUG:
    # Render/Vercel принимают HTTPS и передают запрос дальше — доверяем их заголовку
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True

# ---------- Файлы (чеки, документы, фото поздравлений) ----------
# Без ключей Supabase — папка media/ (для разработки).
# С ключами — Supabase Storage: на бесплатном Render диск стирается при перезапуске.
#   private-бакет: чеки и документы, ссылки подписанные и живут 1 час;
#   public-бакет: фото на стене поздравлений и фон экрана — постоянные ссылки.
SUPABASE_PROJECT_REF = os.getenv("SUPABASE_PROJECT_REF")
SUPABASE_S3_KEY = os.getenv("SUPABASE_S3_ACCESS_KEY_ID")
if SUPABASE_PROJECT_REF and SUPABASE_S3_KEY:
    _s3 = {
        "endpoint_url": f"https://{SUPABASE_PROJECT_REF}.storage.supabase.co/storage/v1/s3",
        "region_name": os.getenv("SUPABASE_S3_REGION", "ap-northeast-2"),
        "access_key": SUPABASE_S3_KEY,
        "secret_key": os.getenv("SUPABASE_S3_SECRET_ACCESS_KEY"),
        "addressing_style": "path",
        "signature_version": "s3v4",
        "file_overwrite": False,
        "default_acl": None,
    }
    _public_bucket = os.getenv("SUPABASE_PUBLIC_BUCKET", "eventops-public")
    STORAGES = {
        "default": {
            "BACKEND": "storages.backends.s3.S3Storage",
            "OPTIONS": {**_s3, "bucket_name": os.getenv("SUPABASE_PRIVATE_BUCKET", "eventops-private"),
                        "querystring_auth": True, "querystring_expire": 3600},
        },
        "public": {
            "BACKEND": "storages.backends.s3.S3Storage",
            "OPTIONS": {**_s3, "bucket_name": _public_bucket, "querystring_auth": False,
                        "custom_domain": f"{SUPABASE_PROJECT_REF}.supabase.co/storage/v1/object/public/{_public_bucket}"},
        },
        "staticfiles": {"BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"},
    }
else:
    STORAGES = {
        "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
        "public": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
        "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
    }

PUBLIC_BASE_URL = os.getenv("PUBLIC_BASE_URL", "http://localhost:5173")
