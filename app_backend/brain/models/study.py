from django.db import models

from .owned import OwnedModel


class Subject(OwnedModel):
    class Priority(models.TextChoices):
        NORMAL = "normal", "Em andamento"
        HIGH = "high", "Alta prioridade"
        REVIEW = "review", "Revisão hoje"

    title = models.CharField(max_length=120)
    module = models.CharField(max_length=80, blank=True)
    description = models.CharField(max_length=255, blank=True)
    priority = models.CharField(max_length=10, choices=Priority.choices, default=Priority.NORMAL)
    hours_done = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    hours_goal = models.DecimalField(max_digits=6, decimal_places=2, default=10)

    class Meta:
        db_table = "study_subjects"
        ordering = ("created_at",)

    def __str__(self):
        return self.title


class ScheduleBlock(OwnedModel):
    class Status(models.TextChoices):
        DONE = "done", "Concluído"
        NEXT = "next", "Próximo"
        PENDING = "pending", "Pendente"

    date = models.DateField()
    start = models.TimeField()
    end = models.TimeField()
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    title = models.CharField(max_length=120)
    description = models.CharField(max_length=255, blank=True)

    class Meta:
        db_table = "study_schedule_blocks"
        ordering = ("date", "start")

    def __str__(self):
        return f"{self.date} {self.start:%H:%M} {self.title}"


class Flashcard(OwnedModel):
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name="flashcards")
    front = models.TextField()
    back = models.TextField()
    due = models.BooleanField(default=True, help_text="Pendente de revisão.")
    hits = models.PositiveIntegerField(default=0)
    misses = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "study_flashcards"
        ordering = ("created_at",)

    def __str__(self):
        return self.front[:60]


class StudyLog(OwnedModel):
    """Horas estudadas num dia (uma linha por usuário/dia)."""

    date = models.DateField()
    hours = models.DecimalField(max_digits=5, decimal_places=2, default=0)

    class Meta:
        db_table = "study_logs"
        ordering = ("date",)
        constraints = [models.UniqueConstraint(fields=("user", "date"), name="uniq_study_log_user_date")]

    def __str__(self):
        return f"{self.date}: {self.hours}h"
