from datetime import date, timedelta
from decimal import Decimal

from django.db import transaction
from django.db.models import Sum

from brain.models import Exercise, TrainingLog, User, Workout

from .weeks import today, week_days, week_start


def estimate_volume_kg(workout: Workout) -> Decimal:
    """Tonelagem estimada: soma de séries × carga (reps são texto livre; assume 10 quando carga > 0)."""
    total = Decimal("0")
    for ex in workout.exercises.all():
        if ex.load > 0:
            total += Decimal(ex.sets) * Decimal(10) * ex.load
    return total


def estimate_duration_seconds(workout: Workout) -> int:
    """~45 s por série + descanso entre séries."""
    sets = sum(ex.sets for ex in workout.exercises.all())
    return sets * (45 + workout.rest_seconds)


def week_done(user: User, start: date) -> list[bool]:
    days = week_days(start)
    done = set(TrainingLog.objects.filter(user=user, date__in=days).values_list("date", flat=True))
    return [d in done for d in days]


@transaction.atomic
def finish_session(user: User, workout: Workout | None, duration_seconds: int, day: date | None = None) -> TrainingLog:
    """Fecha a sessão: grava o log e desmarca os exercícios para o próximo treino."""
    log = TrainingLog.objects.create(
        user=user,
        workout=workout,
        date=day or today(),
        duration_seconds=duration_seconds,
        volume_kg=estimate_volume_kg(workout) if workout else Decimal("0"),
    )
    if workout:
        Exercise.objects.filter(workout=workout).update(done=False)
    return log


def tonnage_by_week(user: User, weeks: int = 6) -> list[dict]:
    """Volume total das últimas `weeks` semanas (mais antiga primeiro)."""
    start = week_start() - timedelta(weeks=weeks - 1)
    rows = TrainingLog.objects.filter(user=user, date__gte=start).values("date").annotate(volume=Sum("volume_kg"))
    buckets: dict[date, Decimal] = {start + timedelta(weeks=i): Decimal("0") for i in range(weeks)}
    for row in rows:
        buckets[week_start(row["date"])] += row["volume"]
    return [{"week": k.isoformat(), "volume_kg": v} for k, v in buckets.items()]
