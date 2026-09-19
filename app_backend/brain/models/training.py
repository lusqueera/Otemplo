from django.db import models

from .owned import OwnedModel


class Workout(OwnedModel):
    class Intensity(models.TextChoices):
        LOW = "low", "Leve"
        MODERATE = "moderate", "Moderada"
        HIGH = "high", "Alta intensidade"

    title = models.CharField(max_length=120)
    description = models.CharField(max_length=255, blank=True)
    time = models.TimeField(null=True, blank=True, help_text="Horário previsto.")
    intensity = models.CharField(max_length=10, choices=Intensity.choices, default=Intensity.MODERATE)
    rest_seconds = models.PositiveSmallIntegerField(default=90)

    class Meta:
        db_table = "workouts"
        ordering = ("created_at",)

    def __str__(self):
        return self.title


class Exercise(models.Model):
    class Group(models.TextChoices):
        ABC = "abc", "Divisão ABC"
        CARDIO = "cardio", "Cardio & Mobilidade"

    workout = models.ForeignKey(Workout, on_delete=models.CASCADE, related_name="exercises")
    order = models.PositiveSmallIntegerField(default=0)
    name = models.CharField(max_length=120)
    sets = models.PositiveSmallIntegerField(default=3)
    reps = models.CharField(max_length=60, blank=True, help_text="Texto livre: '8-10 reps', '60 seg'.")
    load = models.DecimalField(max_digits=6, decimal_places=2, default=0, help_text="kg; 0 = peso corporal/cardio.")
    delta = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    muscle = models.CharField(max_length=80, blank=True)
    group = models.CharField(max_length=10, choices=Group.choices, default=Group.ABC)
    icon = models.CharField(max_length=40, default="dumbbell")
    done = models.BooleanField(default=False)

    class Meta:
        db_table = "exercises"
        ordering = ("order", "id")

    def __str__(self):
        return self.name


class TrainingLog(OwnedModel):
    """Sessão de treino concluída."""

    workout = models.ForeignKey(Workout, on_delete=models.SET_NULL, null=True, blank=True, related_name="logs")
    date = models.DateField()
    duration_seconds = models.PositiveIntegerField(default=0)
    volume_kg = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    class Meta:
        db_table = "training_logs"
        ordering = ("-date", "-created_at")

    def __str__(self):
        return f"{self.date} {self.workout or 'treino'}"
