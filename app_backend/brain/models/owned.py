from django.conf import settings
from django.db import models

from .base import BaseModel


class OwnedModel(BaseModel):
    """Registro que pertence a um usuário; toda consulta da API é filtrada por `user`."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        to_field="user_uuid",
        db_column="user_uuid",
        related_name="+",
    )

    class Meta:
        abstract = True
