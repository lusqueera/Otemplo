"""Indicadores derivados dos registros — substituem os números fixos que o app exibia."""

from datetime import date, timedelta
from decimal import Decimal

from django.db.models import Sum

from brain.models import Habit, HabitLog, Profile, StudyLog, TrainingLog, Transaction, User

from .finance import filter_period, month_ref, summarize, total_allocation
from .weeks import today, week_start

ZERO = Decimal("0")


def pct_change(current: Decimal | float | int, previous: Decimal | float | int) -> float | None:
    """Variação percentual; None quando não há base de comparação."""
    if not previous:
        return None
    return round(float((Decimal(current) - Decimal(previous)) / Decimal(previous) * 100), 1)


def _streaks(days: set[date], ref: date) -> tuple[int, int]:
    """(sequência atual até `ref`, maior sequência) de um conjunto de dias."""
    if not days:
        return 0, 0
    cursor = ref if ref in days else ref - timedelta(days=1)
    current = 0
    while cursor in days:
        current += 1
        cursor -= timedelta(days=1)
    record = run = 0
    for d in sorted(days):
        run = run + 1 if (d - timedelta(days=1)) in days else 1
        record = max(record, run)
    return current, record


# ---- Estudo


def study_stats(user: User) -> dict:
    ref = today()
    this_start = week_start(ref)
    last_start = this_start - timedelta(days=7)
    logs = StudyLog.objects.filter(user=user, hours__gt=0)
    days = set(logs.values_list("date", flat=True))
    streak, record = _streaks(days, ref)

    def total(start: date, end: date) -> Decimal:
        return logs.filter(date__gte=start, date__lt=end).aggregate(t=Sum("hours"))["t"] or ZERO

    week_hours = total(this_start, this_start + timedelta(days=7))
    last_week_hours = total(last_start, this_start)
    # Média histórica por dia estudado, para o "vs média" da home
    studied_days = len(days)
    historical = (logs.aggregate(t=Sum("hours"))["t"] or ZERO) / studied_days if studied_days else ZERO
    return {
        "streak": streak,
        "record_streak": record,
        "week_hours": week_hours,
        "last_week_hours": last_week_hours,
        "weekly_change_pct": pct_change(week_hours, last_week_hours),
        "historical_daily_average": historical.quantize(Decimal("0.01")),
    }


# ---- Hábitos


def habits_stats(user: User, days: int = 30) -> dict:
    ref = today()
    habits = list(Habit.objects.filter(user=user))
    total_habits = len(habits)
    this_start = week_start(ref)
    last_start = this_start - timedelta(days=7)
    logs = HabitLog.objects.filter(habit__in=habits)

    def consistency(start: date, end: date, slots_per_habit: int) -> float:
        if not total_habits:
            return 0.0
        done = logs.filter(date__gte=start, date__lt=end).count()
        return round(100 * done / (total_habits * slots_per_habit), 1)

    week = consistency(this_start, this_start + timedelta(days=7), 7)
    last_week = consistency(last_start, this_start, 7)
    month = consistency(ref - timedelta(days=29), ref + timedelta(days=1), 30)
    last_month = consistency(ref - timedelta(days=59), ref - timedelta(days=29), 30)

    # Densidade: quantos hábitos foram feitos por dia, em faixas 0–3 (mais antigo primeiro)
    window_start = ref - timedelta(days=days - 1)
    per_day: dict[date, int] = {}
    for d in logs.filter(date__gte=window_start, date__lte=ref).values_list("date", flat=True):
        per_day[d] = per_day.get(d, 0) + 1
    density = []
    for i in range(days):
        d = window_start + timedelta(days=i)
        ratio = per_day.get(d, 0) / total_habits if total_habits else 0
        density.append(0 if ratio == 0 else 1 if ratio < 0.5 else 2 if ratio < 1 else 3)

    # Recorde: maior sequência já registrada em qualquer hábito
    record = 0
    for habit in habits:
        _, best = _streaks(set(logs.filter(habit=habit).values_list("date", flat=True)), ref)
        record = max(record, best)

    return {
        "week_consistency": week,
        "last_week_consistency": last_week,
        "month_consistency": month,
        "last_month_consistency": last_month,
        "monthly_change_pct": pct_change(month, last_month),
        "record_streak": record,
        "density": density,
    }


# ---- Treino


def training_stats(user: User) -> dict:
    ref = today()
    this_start = week_start(ref)
    last_start = this_start - timedelta(days=7)
    logs = TrainingLog.objects.filter(user=user)

    def week(start: date) -> dict:
        agg = logs.filter(date__gte=start, date__lt=start + timedelta(days=7)).aggregate(
            volume=Sum("volume_kg"), seconds=Sum("duration_seconds")
        )
        return {"volume": agg["volume"] or ZERO, "seconds": agg["seconds"] or 0}

    this_week, last_week = week(this_start), week(last_start)
    sessions = logs.filter(date__gte=this_start).count()
    profile = Profile.objects.filter(user=user).first()
    goal_sessions = profile.workouts if profile else 5
    # Meta de tempo ativo: sessões previstas na semana × 1h
    goal_seconds = goal_sessions * 3600
    return {
        "week_volume_kg": this_week["volume"],
        "last_week_volume_kg": last_week["volume"],
        "volume_change_kg": this_week["volume"] - last_week["volume"],
        "week_active_seconds": this_week["seconds"],
        "goal_active_seconds": goal_seconds,
        "week_sessions": sessions,
        "avg_session_seconds": round(this_week["seconds"] / sessions) if sessions else 0,
    }


# ---- Finanças


def net_worth_evolution(user: User, months: int = 6) -> list[dict]:
    """Patrimônio no fim de cada mês (mais antigo primeiro).

    Só a alocação atual é conhecida; os meses anteriores são reconstruídos subtraindo
    o fluxo líquido dos meses seguintes.
    """
    current = total_allocation(user)
    points = []
    running = current
    for offset in range(0, -months, -1):
        year, month = month_ref(offset)
        points.append({"month": f"{year:04d}-{month:02d}", "net_worth": running})
        net = summarize(filter_period(Transaction.objects.filter(user=user), "month", offset))["net"]
        running -= net
    points.reverse()
    return points


def finance_stats(user: User, period: str = "month", offset: int = 0) -> dict:
    qs = Transaction.objects.filter(user=user)
    span = {"month": 1, "quarter": 3, "year": 12}.get(period)
    current = summarize(filter_period(qs, period, offset))
    previous = summarize(filter_period(qs, period, offset - span)) if span else summarize(qs.none())
    profile = Profile.objects.filter(user=user).first()
    evolution = net_worth_evolution(user, 2)
    return {
        "net_worth": evolution[-1]["net_worth"],
        "net_worth_change_pct": pct_change(evolution[-1]["net_worth"], evolution[0]["net_worth"]),
        "savings_change_pct": pct_change(current["investment"], previous["investment"]),
        "expense_ceiling": profile.expense_ceiling if profile else ZERO,
    }
