from django.conf import settings
from django.db import models

from .base import BaseModel


class Profile(BaseModel):
    """Preferências do usuário: metas semanais, citações e ritmo circadiano (1:1 com User)."""

    class Curator(models.TextChoices):
        STOIC = "stoic", "Estoica"
        RENAISSANCE = "renaissance", "Renascentista"
        EASTERN = "eastern", "Oriental"
        MODERN = "modern", "Contemporânea"

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile")

    # Metas semanais
    study_hours = models.PositiveSmallIntegerField(default=25)
    workouts = models.PositiveSmallIntegerField(default=5)
    habits_consistency = models.PositiveSmallIntegerField(default=85, help_text="Consistência mínima, em %.")
    monthly_savings = models.DecimalField(max_digits=12, decimal_places=2, default=5000)
    expense_ceiling = models.DecimalField(
        max_digits=12, decimal_places=2, default=8500, help_text="Teto mensal de despesas."
    )

    # Citações
    quotes_enabled = models.BooleanField(default=True)
    quote_curators = models.JSONField(default=list, help_text="Curadorias ativas (Profile.Curator).")
    quote_time = models.TimeField(default="07:00")

    # Ritmo circadiano
    wake_time = models.TimeField(default="06:00")
    bed_time = models.TimeField(default="22:30")
    wind_down_minutes = models.PositiveSmallIntegerField(default=30, help_text="0 = desligado.")
    blue_light_filter = models.BooleanField(default=True)
    dim_at_dusk = models.BooleanField(default=True)
    habit_reminders = models.BooleanField(default=True)

    class Meta:
        db_table = "profiles"

    def __str__(self):
        return f"Perfil de {self.user.email}"
