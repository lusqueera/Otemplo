import os
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/6.1/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv("SECRET_KEY")

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv("DEBUG", "0") == "1"

ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")

# Atrás do nginx (VPS): confia no X-Forwarded-Proto e endurece cookies/HSTS quando há TLS.
# Sem domínio/TLS (só IP) mantenha SECURE_SSL=0 — o check --deploy só emite avisos, não erros.
BEHIND_PROXY = os.getenv("BEHIND_PROXY", "0") == "1"
SECURE_SSL = os.getenv("SECURE_SSL", "0") == "1"
if BEHIND_PROXY:
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    USE_X_FORWARDED_HOST = True
if SECURE_SSL:
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 60 * 60 * 24 * 30
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True

# CORS — necessário só para o Expo Web (navegador); apps nativos não fazem preflight.
# Em DEBUG aceita qualquer origem (Metro muda de porta/IP); em produção, liste-as em CORS_ALLOWED_ORIGINS.
CORS_ALLOW_ALL_ORIGINS = DEBUG
CORS_ALLOWED_ORIGINS = [o for o in os.getenv("CORS_ALLOWED_ORIGINS", "").split(",") if o]


# Application definition

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "reversion",
    "rest_framework",
    "rest_framework_simplejwt.token_blacklist",
    "drf_spectacular",
    "corsheaders",
    "brain",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    # Antes de CommonMiddleware para responder ao preflight (OPTIONS)
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "core.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": ("rest_framework_simplejwt.authentication.JWTAuthentication",),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
    "DEFAULT_PAGINATION_CLASS": "brain.pagination.DefaultPagination",
    "PAGE_SIZE": 50,
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    # JSON em camelCase para casar com o app (snake_case internamente)
    "DEFAULT_RENDERER_CLASSES": (
        "djangorestframework_camel_case.render.CamelCaseJSONRenderer",
        "djangorestframework_camel_case.render.CamelCaseBrowsableAPIRenderer",
    ),
    "DEFAULT_PARSER_CLASSES": (
        "djangorestframework_camel_case.parser.CamelCaseJSONParser",
        "djangorestframework_camel_case.parser.CamelCaseFormParser",
        "djangorestframework_camel_case.parser.CamelCaseMultiPartParser",
    ),
}
SPECTACULAR_SETTINGS = {
    "TITLE": "Atelier Noir API",
    "DESCRIPTION": "API do app Atelier Noir (estudos, hábitos, treino e finanças).",
    "VERSION": "0.1.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "COMPONENT_SPLIT_REQUEST": True,
    "CAMELIZE_NAMES": True,
    "POSTPROCESSING_HOOKS": [
        "drf_spectacular.contrib.djangorestframework_camel_case.camelize_serializer_fields",
        "drf_spectacular.hooks.postprocess_schema_enums",
    ],
}
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(hours=1),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=30),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
}

WSGI_APPLICATION = "core.wsgi.application"


# Database
# https://docs.djangoproject.com/en/6.1/ref/settings/#databases

# Postgres local ou Supabase. Para o Supabase use o Session pooler (porta 5432, IPv4) com DB_SSLMODE=require;
# o Transaction pooler (6543) não suporta prepared statements/cursores, por isso DB_POOLER=transaction os desliga.
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("DB_NAME"),
        "USER": os.getenv("DB_USER"),
        "PASSWORD": os.getenv("DB_PASSWORD"),
        "HOST": os.getenv("DB_HOST"),
        "PORT": os.getenv("DB_PORT"),
        "CONN_MAX_AGE": int(os.getenv("DB_CONN_MAX_AGE", "60")),
        "CONN_HEALTH_CHECKS": True,
        "DISABLE_SERVER_SIDE_CURSORS": os.getenv("DB_POOLER") == "transaction",
        "OPTIONS": {"sslmode": os.getenv("DB_SSLMODE", "prefer")},
    }
}


# Password validation
# https://docs.djangoproject.com/en/6.1/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]


# Internationalization
# https://docs.djangoproject.com/en/6.1/topics/i18n/

LANGUAGE_CODE = "pt-br"

TIME_ZONE = "America/Sao_Paulo"

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/6.1/howto/static-files/

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

# Uploads (foto de perfil)
# Com SUPABASE_S3_* no .env os arquivos vão para o Storage do Supabase (API compatível com S3);
# sem eles, ficam em MEDIA_ROOT (dev local).
MEDIA_ROOT = BASE_DIR / "media"
SUPABASE_S3_ENDPOINT = os.getenv("SUPABASE_S3_ENDPOINT")  # https://<ref>.storage.supabase.co/storage/v1/s3
SUPABASE_S3_BUCKET = os.getenv("SUPABASE_S3_BUCKET", "media")
SUPABASE_PROJECT_URL = os.getenv("SUPABASE_PROJECT_URL", "").rstrip("/")  # https://<ref>.supabase.co
# URL pública dos objetos (servida pelo Storage, não pelo endpoint S3)
SUPABASE_PUBLIC_BASE = f"{SUPABASE_PROJECT_URL}/storage/v1/object/public/{SUPABASE_S3_BUCKET}"

if SUPABASE_S3_ENDPOINT:
    STORAGES = {
        "default": {
            "BACKEND": "storages.backends.s3.S3Storage",
            "OPTIONS": {
                "endpoint_url": SUPABASE_S3_ENDPOINT,
                "bucket_name": SUPABASE_S3_BUCKET,
                "access_key": os.getenv("SUPABASE_S3_ACCESS_KEY"),
                "secret_key": os.getenv("SUPABASE_S3_SECRET_KEY"),
                "region_name": os.getenv("SUPABASE_S3_REGION", "us-east-1"),
                # Bucket público: URLs diretas, sem assinatura; ACLs não existem no Supabase
                "querystring_auth": False,
                "default_acl": None,
                "file_overwrite": True,
                "addressing_style": "path",
                "custom_domain": SUPABASE_PUBLIC_BASE.removeprefix("https://"),
            },
        },
        "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
    }
    MEDIA_URL = f"{SUPABASE_PUBLIC_BASE}/"
else:
    MEDIA_URL = "media/"


# Email
# https://docs.djangoproject.com/en/6.1/topics/email/#topic-email-configuration

# Com EMAIL_HOST definido usa SMTP; sem ele, imprime no console (a API ainda não envia e-mail)
# e silencia o check mail.E001 para o deploy não falhar.
if os.getenv("EMAIL_HOST"):
    MAILERS = {
        "default": {
            "BACKEND": "django.core.mail.backends.smtp.EmailBackend",
            "OPTIONS": {
                "host": os.getenv("EMAIL_HOST"),
                "port": int(os.getenv("EMAIL_PORT", "587")),
                "username": os.getenv("EMAIL_HOST_USER", ""),
                "password": os.getenv("EMAIL_HOST_PASSWORD", ""),
                "use_tls": os.getenv("EMAIL_USE_TLS", "1") == "1",
            },
        },
    }
    DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL", "Atelier Noir <no-reply@ateliernoir.app>")
else:
    MAILERS = {"default": {"BACKEND": "django.core.mail.backends.console.EmailBackend"}}
    SILENCED_SYSTEM_CHECKS = ["mail.E001"]
AUTH_USER_MODEL = "brain.User"
