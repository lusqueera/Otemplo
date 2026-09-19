from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from brain.models import Exercise, TrainingLog, Workout
from brain.serializers import (
    ExerciseSerializer,
    FinishSessionSerializer,
    TonnageSerializer,
    TrainingLogSerializer,
    WeekDoneSerializer,
    WorkoutSerializer,
)
from brain.services import training as svc
from brain.services.weeks import parse_week

from .base import OwnedViewSet

WEEK_PARAM = OpenApiParameter("week", str, description="Qualquer dia da semana (YYYY-MM-DD); padrão: semana atual.")


class WorkoutViewSet(OwnedViewSet):
    """Treinos com exercícios aninhados."""

    queryset = Workout.objects.prefetch_related("exercises")
    serializer_class = WorkoutSerializer

    @extend_schema(request=None, responses=ExerciseSerializer)
    @action(detail=True, methods=["post"], url_path=r"exercises/(?P<exercise_id>\d+)/toggle")
    def toggle_exercise(self, request, id=None, exercise_id=None):
        """Marca/desmarca um exercício como feito na sessão atual."""
        exercise = Exercise.objects.filter(workout=self.get_object(), pk=exercise_id).first()
        if exercise is None:
            return Response(status=status.HTTP_404_NOT_FOUND)
        exercise.done = not exercise.done
        exercise.save(update_fields=("done",))
        return Response(ExerciseSerializer(exercise).data)


class TrainingLogViewSet(OwnedViewSet):
    """Histórico de sessões (somente leitura; use `finish` para registrar)."""

    queryset = TrainingLog.objects.select_related("workout")
    serializer_class = TrainingLogSerializer
    http_method_names = ("get", "post", "delete")

    def create(self, request, *args, **kwargs):
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)

    @extend_schema(request=FinishSessionSerializer, responses={201: TrainingLogSerializer})
    @action(detail=False, methods=["post"])
    def finish(self, request):
        """Fecha a sessão do dia: grava duração/volume e limpa os `done` dos exercícios."""
        data = FinishSessionSerializer(data=request.data, context={"request": request})
        data.is_valid(raise_exception=True)
        v = data.validated_data
        log = svc.finish_session(request.user, v.get("workout"), v["duration_seconds"], v.get("date"))
        return Response(TrainingLogSerializer(log).data, status=status.HTTP_201_CREATED)


class TrainingWeekView(APIView):
    """Dias com treino concluído (Seg..Dom)."""

    serializer_class = WeekDoneSerializer

    @extend_schema(parameters=[WEEK_PARAM], responses=WeekDoneSerializer)
    def get(self, request):
        start = parse_week(request.query_params.get("week"))
        return Response({"week": start.isoformat(), "done": svc.week_done(request.user, start)})


class TonnageView(APIView):
    """Volume (kg) por semana, últimas 6."""

    serializer_class = TonnageSerializer

    @extend_schema(parameters=[OpenApiParameter("weeks", int)], responses=TonnageSerializer(many=True))
    def get(self, request):
        weeks = max(1, min(int(request.query_params.get("weeks", 6)), 52))
        return Response(TonnageSerializer(svc.tonnage_by_week(request.user, weeks), many=True).data)
