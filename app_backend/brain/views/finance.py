from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework.decorators import action
from rest_framework.response import Response

from brain.models import AssetClass, Transaction
from brain.serializers import AssetClassSerializer, SummarySerializer, TransactionSerializer
from brain.services import finance as svc

from .base import OwnedViewSet

PERIOD_PARAMS = [
    OpenApiParameter("period", str, enum=svc.PERIODS, description="Padrão: month."),
    OpenApiParameter("offset", int, description="Meses relativos ao atual (0 = este mês, -1 = anterior)."),
]


def _period(params) -> tuple[str, int]:
    period = params.get("period", "month")
    if period not in svc.PERIODS:
        period = "month"
    try:
        offset = int(params.get("offset", 0))
    except ValueError:
        offset = 0
    return period, offset


class TransactionViewSet(OwnedViewSet):
    """Lançamentos. Filtros: `period` (month|quarter|year|overview), `offset` e `kind`."""

    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer

    @extend_schema(parameters=[*PERIOD_PARAMS, OpenApiParameter("kind", str, enum=Transaction.Kind.values)])
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    def get_queryset(self):
        qs = super().get_queryset()
        if self.action != "list":
            return qs
        period, offset = _period(self.request.query_params)
        qs = svc.filter_period(qs, period, offset)
        kind = self.request.query_params.get("kind")
        if kind in Transaction.Kind.values:
            qs = qs.filter(kind=kind)
        return qs

    @extend_schema(parameters=PERIOD_PARAMS, responses=SummarySerializer)
    @action(detail=False, methods=["get"])
    def summary(self, request):
        """Receitas, despesas por tipo, saldo e patrimônio alocado no período."""
        period, offset = _period(request.query_params)
        qs = svc.filter_period(Transaction.objects.filter(user=request.user), period, offset)
        data = {
            "period": period,
            "offset": offset,
            **svc.summarize(qs),
            "total_allocation": svc.total_allocation(request.user),
        }
        return Response(SummarySerializer(data).data)


class AssetClassViewSet(OwnedViewSet):
    """Alocação patrimonial por classe de ativo."""

    queryset = AssetClass.objects.all()
    serializer_class = AssetClassSerializer
