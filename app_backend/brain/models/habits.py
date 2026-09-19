from django.db import models

from .owned import OwnedModel


class Habit(OwnedModel):
    class Group(models.TextChoices):
        MORNING = "morning", "Manhã"
        FOCUS = "focus", "Foco & Estudo"
        BODY = "body", "Corpo & Saúde"
        NIGHT = "night", "Noturno"

    title = models.CharField(max_length=120)
    category = models.CharField(max_length=80, blank=True)
    group = models.CharField(max_length=10, choices=Group.choices, default=Group.FOCUS)
    goal = models.CharField(max_length=160, blank=True)
    icon = models.CharField(max_length=40, default="book-open-variant")
    streak = models.PositiveIntegerField(default=0, help_text="Sequência atual em dias.")
    scheduled_at = models.TimeField(null=True, blank=True)

    # Hábito quantitativo (ex.: hidratação). `quantity_target` nulo = hábito simples.
    quantity_current = models.PositiveIntegerField(default=0)
    quantity_target = models.PositiveIntegerField(null=True, blank=True)
    quantity_step = models.PositiveIntegerField(default=1)
    quantity_unit = models.CharField(max_length=16, blank=True)

    class Meta:
        db_table = "habits"
        ordering = ("created_at",)

    def __str__(self):
        return self.title

    @property
    def is_quantitative(self) -> bool:
        return self.quantity_target is not None


class HabitLog(models.Model):
    """Dia em que o hábito foi concluído."""

    habit = models.ForeignKey(Habit, on_delete=models.CASCADE, related_name="logs")
    date = models.DateField()

    class Meta:
        db_table = "habit_logs"
        constraints = [models.UniqueConstraint(fields=("habit", "date"), name="uniq_habit_log_habit_date")]

    def __str__(self):
        return f"{self.habit_id} @ {self.date}"
