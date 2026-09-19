from rest_framework import serializers

from brain.models import AssetClass, Transaction

from .base import OwnedSerializer


class TransactionSerializer(OwnedSerializer):
    class Meta(OwnedSerializer.Meta):
        model = Transaction

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Informe um valor maior que zero.")
        return value


class AssetClassSerializer(OwnedSerializer):
    class Meta(OwnedSerializer.Meta):
        model = AssetClass

    def validate_amount(self, value):
        if value < 0:
            raise serializers.ValidationError("Valor não pode ser negativo.")
        return value


class SummarySerializer(serializers.Serializer):
    period = serializers.CharField()
    offset = serializers.IntegerField()
    income = serializers.DecimalField(max_digits=14, decimal_places=2)
    expenses = serializers.DecimalField(max_digits=14, decimal_places=2)
    net = serializers.DecimalField(max_digits=14, decimal_places=2)
    essential = serializers.DecimalField(max_digits=14, decimal_places=2)
    investment = serializers.DecimalField(max_digits=14, decimal_places=2)
    lifestyle = serializers.DecimalField(max_digits=14, decimal_places=2)
    total_allocation = serializers.DecimalField(max_digits=14, decimal_places=2)
