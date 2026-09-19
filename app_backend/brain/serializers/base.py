from rest_framework import serializers


class OwnedSerializer(serializers.ModelSerializer):
    """Expõe `external_id` como `id`; o `user` vem do request, nunca do payload."""

    id = serializers.UUIDField(source="external_id", read_only=True)

    class Meta:
        exclude = ("user", "external_id")
        read_only_fields = ("created_at", "updated_at")

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)
