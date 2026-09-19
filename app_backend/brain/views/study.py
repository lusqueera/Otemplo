from datetime import timedelta

from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from brain.models import Flashcard, ScheduleBlock, Subject
from brain.serializers import (
    FlashcardReviewSerializer,
    FlashcardSerializer,
    ScheduleBlockSerializer,
    StudyLogSerializer,
    StudySessionSerializer,
    SubjectSerializer,
    WeekHoursSerializer,
)
from brain.services import study as svc
from brain.services.weeks import parse_week

from .base import OwnedViewSet

WEEK_PARAM = OpenApiParameter("week", str, description="Qualquer dia da semana (YYYY-MM-DD); padrão: semana atual.")


class SubjectViewSet(OwnedViewSet):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer


class ScheduleBlockViewSet(OwnedViewSet):
    """Blocos do cronograma. Filtros: `?date=YYYY-MM-DD` ou `?week=YYYY-MM-DD`."""

    queryset = ScheduleBlock.objects.all()
    serializer_class = ScheduleBlockSerializer

    @extend_schema(parameters=[OpenApiParameter("date", str), WEEK_PARAM])
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params
        if params.get("date"):
            return qs.filter(date=params["date"])
        if params.get("week"):
            start = parse_week(params["week"])
            return qs.filter(date__gte=start, date__lt=start + timedelta(days=7))
        return qs


class FlashcardViewSet(OwnedViewSet):
    """Flashcards. `?due=1` lista só os pendentes; `?subject=<id>` filtra por matéria."""

    queryset = Flashcard.objects.select_related("subject")
    serializer_class = FlashcardSerializer

    @extend_schema(parameters=[OpenApiParameter("due", bool), OpenApiParameter("subject", str)])
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params
        if params.get("due") in ("1", "true"):
            qs = qs.filter(due=True)
        if params.get("subject"):
            qs = qs.filter(subject__external_id=params["subject"])
        return qs

    @extend_schema(request=FlashcardReviewSerializer, responses=FlashcardSerializer)
    @action(detail=True, methods=["post"])
    def review(self, request, id=None):
        """Registra acerto/erro e atualiza `due`."""
        data = FlashcardReviewSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        card = svc.review_flashcard(self.get_object(), data.validated_data["correct"])
        return Response(self.get_serializer(card).data)

    @extend_schema(request=None, responses={200: {"type": "object", "properties": {"reset": {"type": "integer"}}}})
    @action(detail=False, methods=["post"], url_path="reset-due")
    def reset_due(self, request):
        """Marca todos os cards como pendentes (novo ciclo de revisão)."""
        return Response({"reset": svc.reset_due(request.user)})


class StudyHoursView(APIView):
    """Horas estudadas por dia (Seg..Dom) da semana."""

    serializer_class = WeekHoursSerializer

    @extend_schema(parameters=[WEEK_PARAM], responses=WeekHoursSerializer)
    def get(self, request):
        start = parse_week(request.query_params.get("week"))
        data = {"week": start.isoformat(), "hours": svc.hours_of_week(request.user, start)}
        return Response(WeekHoursSerializer(data).data)


class StudySessionView(APIView):
    """Fecha uma sessão do cronômetro somando o tempo ao dia (e à matéria)."""

    serializer_class = StudySessionSerializer

    @extend_schema(request=StudySessionSerializer, responses={201: StudyLogSerializer})
    def post(self, request):
        data = StudySessionSerializer(data=request.data, context={"request": request})
        data.is_valid(raise_exception=True)
        v = data.validated_data
        log = svc.log_session(request.user, v["seconds"], v.get("subject"), v.get("date"))
        return Response(StudyLogSerializer(log).data, status=status.HTTP_201_CREATED)
