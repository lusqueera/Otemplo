from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework.decorators import action
from rest_framework.response import Response

from brain.models import Habit
from brain.serializers import HabitDaySerializer, HabitSerializer
from brain.services import habits as svc
from brain.services.weeks import parse_week

from .base import OwnedViewSet

WEEK_PARAM = OpenApiParameter("week", str, description="Qualquer dia da semana (YYYY-MM-DD); padrão: semana atual.")


class HabitViewSet(OwnedViewSet):
    """Hábitos. Cada item traz `weekly` da semana pedida em `?week=`."""

    queryset = Habit.objects.all()
    serializer_class = HabitSerializer

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        start = parse_week(self.request.query_params.get("week"))
        ctx["week_start"] = start
        # Na listagem, uma única query resolve a semana de todos os hábitos
        if self.action == "list":
            ctx["weekly"] = svc.weekly_map(list(self.get_queryset()), start)
        return ctx

    @extend_schema(parameters=[WEEK_PARAM])
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(request=HabitDaySerializer, responses=HabitSerializer, parameters=[WEEK_PARAM])
    @action(detail=True, methods=["post"])
    def toggle(self, request, id=None):
        """Marca/desmarca o hábito no dia (`date`, padrão hoje) e recalcula a sequência."""
        data = HabitDaySerializer(data=request.data)
        data.is_valid(raise_exception=True)
        habit, _ = svc.toggle(self.get_object(), data.validated_data.get("date"))
        return Response(self.get_serializer(habit).data)

    @extend_schema(request=HabitDaySerializer, responses=HabitSerializer, parameters=[WEEK_PARAM])
    @action(detail=True, methods=["post"])
    def increment(self, request, id=None):
        """Soma `step` ao progresso de um hábito quantitativo; ao bater a meta, marca o dia."""
        data = HabitDaySerializer(data=request.data)
        data.is_valid(raise_exception=True)
        habit = svc.increment(self.get_object(), data.validated_data.get("date"))
        return Response(self.get_serializer(habit).data)

    @extend_schema(
        parameters=[WEEK_PARAM],
        responses={
            200: {"type": "object", "properties": {"week": {"type": "string"}, "consistency": {"type": "number"}}}
        },
    )
    @action(detail=False, methods=["get"])
    def consistency(self, request):
        """Percentual de execuções da semana (0–100)."""
        start = parse_week(request.query_params.get("week"))
        return Response({"week": start.isoformat(), "consistency": svc.consistency(request.user, start)})
