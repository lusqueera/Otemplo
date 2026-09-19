"""Semanas no mesmo formato do app (segunda = índice 0, chave = ISO da segunda)."""

from datetime import date, timedelta

from django.utils import timezone


def today() -> date:
    return timezone.localdate()


def week_start(day: date | None = None) -> date:
    """Segunda-feira da semana de `day`."""
    day = day or today()
    return day - timedelta(days=day.weekday())


def week_days(start: date) -> list[date]:
    return [start + timedelta(days=i) for i in range(7)]


def week_key(day: date | None = None) -> str:
    return week_start(day).isoformat()


def parse_week(value: str | None) -> date:
    """`?week=YYYY-MM-DD` (qualquer dia da semana) → segunda-feira; sem valor = semana atual."""
    if not value:
        return week_start()
    return week_start(date.fromisoformat(value))
