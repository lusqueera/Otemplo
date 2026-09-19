from django.db import transaction
from rest_framework import serializers

from brain.models import Exercise, TrainingLog, Workout
from brain.services import training as svc

from .base import OwnedSerializer


class ExerciseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exercise
        exclude = ("workout",)
        read_only_fields = ("id", "order")


class WorkoutSerializer(OwnedSerializer):
    """Treino com exercícios aninhados; enviar `exercises` no PUT/PATCH substitui a lista inteira."""

    exercises = ExerciseSerializer(many=True, required=False)
    estimated_duration_seconds = serializers.SerializerMethodField()
    estimated_volume_kg = serializers.SerializerMethodField()

    class Meta(OwnedSerializer.Meta):
        model = Workout

    def get_estimated_duration_seconds(self, workout) -> int:
        return svc.estimate_duration_seconds(workout)

    def get_estimated_volume_kg(self, workout) -> str:
        return str(svc.estimate_volume_kg(workout))

    @transaction.atomic
    def create(self, validated_data):
        exercises = validated_data.pop("exercises", [])
        workout = super().create(validated_data)
        self._replace_exercises(workout, exercises)
        return workout

    @transaction.atomic
    def update(self, instance, validated_data):
        exercises = validated_data.pop("exercises", None)
        workout = super().update(instance, validated_data)
        if exercises is not None:
            self._replace_exercises(workout, exercises)
        return workout

    @staticmethod
    def _replace_exercises(workout, items):
        workout.exercises.all().delete()
        Exercise.objects.bulk_create([Exercise(workout=workout, order=i, **item) for i, item in enumerate(items)])


class TrainingLogSerializer(OwnedSerializer):
    workout = serializers.SlugRelatedField(slug_field="external_id", read_only=True)

    class Meta(OwnedSerializer.Meta):
        model = TrainingLog


class FinishSessionSerializer(serializers.Serializer):
    workout = serializers.SlugRelatedField(
        slug_field="external_id", queryset=Workout.objects.none(), required=False, allow_null=True
    )
    duration_seconds = serializers.IntegerField(min_value=0, max_value=12 * 3600)
    date = serializers.DateField(required=False)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            self.fields["workout"].queryset = Workout.objects.filter(user=request.user)


class WeekDoneSerializer(serializers.Serializer):
    week = serializers.CharField()
    done = serializers.ListField(child=serializers.BooleanField())


class TonnageSerializer(serializers.Serializer):
    week = serializers.CharField()
    volume_kg = serializers.DecimalField(max_digits=12, decimal_places=2)
