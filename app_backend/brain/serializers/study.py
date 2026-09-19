from rest_framework import serializers

from brain.models import Flashcard, ScheduleBlock, StudyLog, Subject

from .base import OwnedSerializer


class SubjectSerializer(OwnedSerializer):
    class Meta(OwnedSerializer.Meta):
        model = Subject


class ScheduleBlockSerializer(OwnedSerializer):
    class Meta(OwnedSerializer.Meta):
        model = ScheduleBlock

    def validate(self, attrs):
        start = attrs.get("start", getattr(self.instance, "start", None))
        end = attrs.get("end", getattr(self.instance, "end", None))
        if start and end and end <= start:
            raise serializers.ValidationError({"end": "Fim deve ser depois do início."})
        return attrs


class FlashcardSerializer(OwnedSerializer):
    subject = serializers.SlugRelatedField(slug_field="external_id", queryset=Subject.objects.none())

    class Meta(OwnedSerializer.Meta):
        model = Flashcard
        read_only_fields = (*OwnedSerializer.Meta.read_only_fields, "hits", "misses")

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Só matérias do próprio usuário
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            self.fields["subject"].queryset = Subject.objects.filter(user=request.user)


class FlashcardReviewSerializer(serializers.Serializer):
    correct = serializers.BooleanField()


class StudyLogSerializer(OwnedSerializer):
    class Meta(OwnedSerializer.Meta):
        model = StudyLog


class StudySessionSerializer(serializers.Serializer):
    """Fechamento de uma sessão do cronômetro."""

    seconds = serializers.IntegerField(min_value=1, max_value=24 * 3600)
    subject = serializers.SlugRelatedField(
        slug_field="external_id", queryset=Subject.objects.none(), required=False, allow_null=True
    )
    date = serializers.DateField(required=False)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            self.fields["subject"].queryset = Subject.objects.filter(user=request.user)


class WeekHoursSerializer(serializers.Serializer):
    week = serializers.CharField(help_text="ISO da segunda-feira.")
    hours = serializers.ListField(child=serializers.DecimalField(max_digits=5, decimal_places=2), help_text="Seg..Dom")
