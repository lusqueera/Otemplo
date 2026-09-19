"""Foto de perfil: recebe base64, grava em MEDIA_ROOT/avatars e devolve a URL pública."""

import base64
import binascii
import io
import re
from pathlib import Path

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from PIL import Image, UnidentifiedImageError

from brain.models import User

MAX_BYTES = 5 * 1024 * 1024
ALLOWED = {"JPEG": "jpg", "PNG": "png", "WEBP": "webp"}
DATA_URI = re.compile(r"^data:image/[\w+.-]+;base64,", re.IGNORECASE)


class InvalidImage(ValueError):
    pass


def decode(payload: str) -> tuple[bytes, str]:
    """Base64 (com ou sem prefixo data URI) → (bytes, extensão)."""
    raw = DATA_URI.sub("", payload.strip())
    try:
        data = base64.b64decode(raw, validate=True)
    except (binascii.Error, ValueError) as exc:
        raise InvalidImage("Base64 inválido.") from exc
    if len(data) > MAX_BYTES:
        raise InvalidImage("Imagem maior que 5 MB.")
    try:
        with Image.open(io.BytesIO(data)) as img:
            img.verify()
            fmt = img.format
    except (UnidentifiedImageError, OSError) as exc:
        raise InvalidImage("Arquivo não é uma imagem válida.") from exc
    if fmt not in ALLOWED:
        raise InvalidImage("Use JPEG, PNG ou WEBP.")
    return data, ALLOWED[fmt]


def save_avatar(user: User, payload: str, build_absolute_uri) -> str:
    """Substitui a foto do usuário e retorna a URL absoluta gravada em `user.avatar`."""
    data, ext = decode(payload)
    remove_avatar(user)
    path = f"avatars/{user.external_id}.{ext}"
    name = default_storage.save(path, ContentFile(data))
    user.avatar = build_absolute_uri(settings.MEDIA_URL + name)
    user.save(update_fields=("avatar", "updated_at"))
    return user.avatar


def remove_avatar(user: User) -> None:
    """Apaga o arquivo anterior (se estiver no nosso storage) e limpa o campo."""
    if not user.avatar:
        return
    media_url = settings.MEDIA_URL
    idx = user.avatar.find(media_url)
    if idx != -1:
        rel = user.avatar[idx + len(media_url) :]
        if rel.startswith("avatars/") and default_storage.exists(rel):
            default_storage.delete(rel)
    user.avatar = None
    user.save(update_fields=("avatar", "updated_at"))


__all__ = ["InvalidImage", "Path", "remove_avatar", "save_avatar"]
