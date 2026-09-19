from uuid import uuid4

from django.db import models


class BaseModel(models.Model):
    """Campos comuns: identificador público (UUID) e timestamps."""

    external_id = models.UUIDField(default=uuid4, unique=True, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        ordering = ("-created_at",)
