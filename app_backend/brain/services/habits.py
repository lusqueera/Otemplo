from datetime import date, timedelta

from django.db import transaction

from brain.models import Habit, HabitLog, User

from .weeks import today, week_days


def weekly_of(habit: Habit, start: date) -> list[bool]:
    """Execuções Seg..Dom na semana iniciada em `start`."""
    days = week_days(start)
    done = set(habit.logs.filter(date__in=days).values_list("date", flat=True))
    return [d in done for d in days]


def weekly_map(habits: list[Habit], start: date) -> dict[int, list[bool]]:
    """Mesmo que `weekly_of`, numa única query para vários hábitos."""
    days = week_days(start)
    done: dict[int, set[date]] = {h.pk: set() for h in habits}
    for habit_id, day in HabitLog.objects.filter(habit__in=habits, date__in=days).values_list("habit_id", "date"):
        done[habit_id].add(day)
    return {h.pk: [d in done[h.pk] for d in days] for h in habits}


def compute_streak(habit: Habit, ref: date | None = None) -> int:
    """Dias consecutivos concluídos até `ref` (hoje). Ontem pendente não quebra a sequência de hoje."""
    ref = ref or today()
    done = set(habit.logs.filter(date__lte=ref, date__gte=ref - timedelta(days=400)).values_list("date", flat=True))
    if ref not in done:
        ref -= timedelta(days=1)
    streak = 0
    while ref in done:
        streak += 1
        ref -= timedelta(days=1)
    return streak


@transaction.atomic
def toggle(habit: Habit, day: date | None = None) -> tuple[Habit, bool]:
    """Marca/desmarca o dia; devolve (hábito, concluído)."""
    day = day or today()
    log, created = HabitLog.objects.get_or_create(habit=habit, date=day)
    done = created
    if not created:
        log.delete()
    if habit.is_quantitative:
        # Concluir manualmente preenche a meta; desfazer zera
        habit.quantity_current = habit.quantity_target if done else 0
    habit.streak = compute_streak(habit)
    habit.save(update_fields=("quantity_current", "streak", "updated_at"))
    return habit, done


@transaction.atomic
def increment(habit: Habit, day: date | None = None) -> Habit:
    """Soma `step` ao progresso; ao bater a meta, marca o dia."""
    if not habit.is_quantitative:
        return habit
    day = day or today()
    habit.quantity_current = min(habit.quantity_current + habit.quantity_step, habit.quantity_target)
    if habit.quantity_current >= habit.quantity_target:
        HabitLog.objects.get_or_create(habit=habit, date=day)
        habit.streak = compute_streak(habit)
    habit.save(update_fields=("quantity_current", "streak", "updated_at"))
    return habit


def consistency(user: User, start: date) -> float:
    """Percentual de execuções na semana (0–100)."""
    habits = list(Habit.objects.filter(user=user))
    if not habits:
        return 0.0
    done = HabitLog.objects.filter(habit__in=habits, date__in=week_days(start)).count()
    return round(100 * done / (len(habits) * 7), 1)
