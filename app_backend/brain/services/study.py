from datetime import date
from decimal import Decimal

from django.db import transaction
from django.db.models import F

from brain.models import Flashcard, StudyLog, Subject, User

from .weeks import today, week_days, week_start


def hours_of_week(user: User, start: date) -> list[Decimal]:
    """Horas por dia (Seg..Dom) da semana iniciada em `start`."""
    days = week_days(start)
    logs = {log.date: log.hours for log in StudyLog.objects.filter(user=user, date__in=days)}
    return [logs.get(d, Decimal("0")) for d in days]


@transaction.atomic
def log_session(user: User, seconds: int, subject: Subject | None = None, day: date | None = None) -> StudyLog:
    """Registra tempo estudado no dia (e na matéria, se houver)."""
    hours = (Decimal(seconds) / Decimal(3600)).quantize(Decimal("0.01"))
    log, _ = StudyLog.objects.get_or_create(user=user, date=day or today())
    log.hours = F("hours") + hours
    log.save(update_fields=("hours", "updated_at"))
    log.refresh_from_db()
    if subject is not None:
        Subject.objects.filter(pk=subject.pk).update(hours_done=F("hours_done") + hours)
    return log


def review_flashcard(card: Flashcard, correct: bool) -> Flashcard:
    if correct:
        card.hits += 1
    else:
        card.misses += 1
    # Errou → continua pendente para revisar de novo hoje
    card.due = not correct
    card.save(update_fields=("hits", "misses", "due", "updated_at"))
    return card


def reset_due(user: User) -> int:
    """Marca todos os cards do usuário como pendentes (início de um novo ciclo)."""
    return Flashcard.objects.filter(user=user).update(due=True)


__all__ = ["hours_of_week", "log_session", "review_flashcard", "reset_due", "week_start"]
