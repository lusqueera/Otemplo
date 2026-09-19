from datetime import date
from decimal import Decimal

from django.db.models import QuerySet, Sum

from brain.models import AssetClass, Transaction, User

from .weeks import today

PERIODS = ("month", "quarter", "year", "overview")


def month_ref(offset: int = 0, base: date | None = None) -> tuple[int, int]:
    """(ano, mês) deslocado `offset` meses a partir do mês atual."""
    base = base or today()
    index = base.year * 12 + (base.month - 1) + offset
    return index // 12, index % 12 + 1


def filter_period(qs: QuerySet, period: str, offset: int = 0) -> QuerySet:
    """Mesma regra de `inPeriod` do app: mês/trimestre/ano relativos ao mês `offset`."""
    if period == "overview":
        return qs
    year, month = month_ref(offset)
    if period == "month":
        return qs.filter(date__year=year, date__month=month)
    if period == "quarter":
        # Este mês e os dois anteriores
        start_year, start_month = month_ref(offset - 2)
        start = date(start_year, start_month, 1)
        end_year, end_month = month_ref(offset + 1)
        end = date(end_year, end_month, 1)
        return qs.filter(date__gte=start, date__lt=end)
    return qs.filter(date__year=year)


def summarize(qs: QuerySet) -> dict[str, Decimal]:
    zero = Decimal("0")
    by_kind = {row["kind"]: row["total"] or zero for row in qs.values("kind").annotate(total=Sum("amount"))}
    income = by_kind.get(Transaction.Kind.INCOME, zero)
    expenses = sum((v for k, v in by_kind.items() if k != Transaction.Kind.INCOME), zero)
    return {
        "income": income,
        "expenses": expenses,
        "net": income - expenses,
        "essential": by_kind.get(Transaction.Kind.ESSENTIAL, zero),
        "investment": by_kind.get(Transaction.Kind.INVESTMENT, zero),
        "lifestyle": by_kind.get(Transaction.Kind.LIFESTYLE, zero),
    }


def total_allocation(user: User) -> Decimal:
    return AssetClass.objects.filter(user=user).aggregate(t=Sum("amount"))["t"] or Decimal("0")
