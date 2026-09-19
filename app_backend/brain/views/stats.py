from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework.response import Response
from rest_framework.views import APIView

from brain.serializers.stats import (
    FinanceStatsSerializer,
    HabitsStatsSerializer,
    NetWorthPointSerializer,
    StudyStatsSerializer,
    TrainingStatsSerializer,
)
from brain.services import stats
from brain.services.finance import PERIODS


class StudyStatsView(APIView):
    """Sequência de dias estudados, horas da semana e variação vs. semana anterior."""

    serializer_class = StudyStatsSerializer

    @extend_schema(responses=StudyStatsSerializer)
    def get(self, request):
        return Response(StudyStatsSerializer(stats.study_stats(request.user)).data)


class HabitsStatsView(APIView):
    """Consistência (semana/mês), recorde de sequência e densidade dos últimos dias."""

    serializer_class = HabitsStatsSerializer

    @extend_schema(parameters=[OpenApiParameter("days", int, description="Janela da densidade (padrão 30).")])
    def get(self, request):
        days = max(7, min(int(request.query_params.get("days", 30)), 90))
        return Response(HabitsStatsSerializer(stats.habits_stats(request.user, days)).data)


class TrainingStatsView(APIView):
    """Volume e tempo ativo da semana vs. anterior, sessões e média por sessão."""

    serializer_class = TrainingStatsSerializer

    @extend_schema(responses=TrainingStatsSerializer)
    def get(self, request):
        return Response(TrainingStatsSerializer(stats.training_stats(request.user)).data)


class NetWorthEvolutionView(APIView):
    """Patrimônio no fim de cada mês, reconstruído a partir da alocação atual e dos fluxos."""

    serializer_class = NetWorthPointSerializer

    @extend_schema(parameters=[OpenApiParameter("months", int)], responses=NetWorthPointSerializer(many=True))
    def get(self, request):
        months = max(2, min(int(request.query_params.get("months", 6)), 36))
        return Response(NetWorthPointSerializer(stats.net_worth_evolution(request.user, months), many=True).data)


class FinanceStatsView(APIView):
    """Variação patrimonial e de aportes vs. período anterior, e teto de despesas."""

    serializer_class = FinanceStatsSerializer

    @extend_schema(
        parameters=[OpenApiParameter("period", str, enum=PERIODS), OpenApiParameter("offset", int)],
        responses=FinanceStatsSerializer,
    )
    def get(self, request):
        period = request.query_params.get("period", "month")
        period = period if period in PERIODS else "month"
        try:
            offset = int(request.query_params.get("offset", 0))
        except ValueError:
            offset = 0
        return Response(FinanceStatsSerializer(stats.finance_stats(request.user, period, offset)).data)
