from rest_framework import serializers

from brain.models import Habit
from brain.services.habits import weekly_of

from .base import OwnedSerializer


class QuantitySerializer(serializers.Serializer):
    current = serializers.IntegerField(source="quantity_current", read_only=True)
    target = serializers.IntegerField(source="quantity_target", min_value=1)
    step = serializers.IntegerField(source="quantity_step", min_value=1)
    unit = serializers.CharField(source="quantity_unit", max_length=16, allow_blank=True)


class HabitSerializer(OwnedSerializer):
    """`weekly` traz a semana pedida em `?week=` (padrão: atual) no formato {chave: [Seg..Dom]}."""

    quantity = QuantitySerializer(source="*", required=False, allow_null=True)
    weekly = serializers.SerializerMethodField()

    class Meta(OwnedSerializer.Meta):
        model = Habit
        exclude = (
            *OwnedSerializer.Meta.exclude,
            "quantity_current",
            "quantity_target",
            "quantity_step",
            "quantity_unit",
        )
        read_only_fields = (*OwnedSerializer.Meta.read_only_fields, "streak")

    def get_weekly(self, habit) -> dict[str, list[bool]]:
        start = self.context.get("week_start")
        if start is None:
            return {}
        prefetched = self.context.get("weekly")
        days = prefetched[habit.pk] if prefetched and habit.pk in prefetched else weekly_of(habit, start)
        return {start.isoformat(): days}

    def to_representation(self, habit):
        data = super().to_representation(habit)
        # Sem meta definida o hábito é simples: `quantity` vira null em vez de um objeto vazio
        if habit.quantity_target is None:
            data["quantity"] = None
        return data

    def to_internal_value(self, data):
        # `quantity: null` limpa o hábito quantitativo
        clear = "quantity" in data and data["quantity"] is None
        attrs = super().to_internal_value(data)
        if clear:
            attrs.update(quantity_target=None, quantity_current=0, quantity_step=1, quantity_unit="")
        return attrs


class HabitDaySerializer(serializers.Serializer):
    date = serializers.DateField(required=False)
