from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from brain.models import Profile, User


class UserSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(source="external_id", read_only=True)

    class Meta:
        model = User
        fields = ("id", "email", "name", "title", "avatar", "created_at")
        read_only_fields = ("email", "avatar", "created_at")


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    name = serializers.CharField(max_length=255)
    title = serializers.CharField(max_length=100, required=False, allow_blank=True, default="")

    def validate_email(self, value):
        value = User.objects.normalize_email(value).lower()
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Já existe uma conta com este e-mail.")
        return value

    def validate_password(self, value):
        validate_password(value)
        return value


class TokenPairSerializer(serializers.Serializer):
    """Resposta de login/registro: usuário + par de tokens."""

    user = UserSerializer()
    access = serializers.CharField()
    refresh = serializers.CharField()

    @classmethod
    def for_user(cls, user: User) -> dict:
        refresh = RefreshToken.for_user(user)
        return {"user": user, "access": str(refresh.access_token), "refresh": str(refresh)}


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate_current_password(self, value):
        if not self.context["request"].user.check_password(value):
            raise serializers.ValidationError("Senha atual incorreta.")
        return value

    def validate_new_password(self, value):
        validate_password(value, self.context["request"].user)
        return value


class AvatarSerializer(serializers.Serializer):
    image = serializers.CharField(write_only=True, help_text="Imagem em base64 (com ou sem prefixo data:image/...).")
    avatar = serializers.URLField(read_only=True)


class ProfileSerializer(serializers.ModelSerializer):
    quote_curators = serializers.ListField(child=serializers.ChoiceField(choices=Profile.Curator.choices))

    class Meta:
        model = Profile
        exclude = ("id", "external_id", "user", "created_at", "updated_at")

    def validate_quote_curators(self, value):
        if not value:
            raise serializers.ValidationError("Mantenha pelo menos uma curadoria ativa.")
        return list(dict.fromkeys(value))
