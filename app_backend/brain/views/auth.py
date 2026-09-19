from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from brain.serializers import (
    AvatarSerializer,
    ChangePasswordSerializer,
    ProfileSerializer,
    RegisterSerializer,
    TokenPairSerializer,
    UserSerializer,
)
from brain.services import account, avatar


class RegisterView(APIView):
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

    @extend_schema(request=RegisterSerializer, responses={201: TokenPairSerializer})
    def post(self, request):
        data = RegisterSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        user = account.register(**data.validated_data)
        return Response(TokenPairSerializer(TokenPairSerializer.for_user(user)).data, status=status.HTTP_201_CREATED)


class MeView(generics.RetrieveUpdateDestroyAPIView):
    """Usuário autenticado: ver, editar nome/título, ou excluir a conta (com todos os dados)."""

    serializer_class = UserSerializer
    http_method_names = ("get", "patch", "delete")

    def get_object(self):
        return self.request.user

    def perform_destroy(self, user):
        account.delete_account(user)


class AvatarView(APIView):
    serializer_class = AvatarSerializer

    @extend_schema(request=AvatarSerializer, responses={200: AvatarSerializer})
    def put(self, request):
        data = AvatarSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        try:
            url = avatar.save_avatar(request.user, data.validated_data["image"], request.build_absolute_uri)
        except avatar.InvalidImage as exc:
            return Response({"image": [str(exc)]}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"avatar": url})

    @extend_schema(responses={204: None})
    def delete(self, request):
        avatar.remove_avatar(request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)


class ChangePasswordView(APIView):
    serializer_class = ChangePasswordSerializer

    @extend_schema(request=ChangePasswordSerializer, responses={204: None})
    def post(self, request):
        data = ChangePasswordSerializer(data=request.data, context={"request": request})
        data.is_valid(raise_exception=True)
        request.user.set_password(data.validated_data["new_password"])
        request.user.save(update_fields=("password", "updated_at"))
        return Response(status=status.HTTP_204_NO_CONTENT)


class LogoutView(APIView):
    """Invalida o refresh token (blacklist). O access expira sozinho."""

    @extend_schema(
        request={"application/json": {"type": "object", "properties": {"refresh": {"type": "string"}}}},
        responses={204: None, 400: OpenApiResponse(description="Token inválido")},
    )
    def post(self, request):
        try:
            RefreshToken(request.data.get("refresh", "")).blacklist()
        except TokenError:
            return Response({"refresh": ["Token inválido ou expirado."]}, status=status.HTTP_400_BAD_REQUEST)
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProfileView(generics.RetrieveUpdateAPIView):
    """Metas semanais, citações e ritmo circadiano."""

    serializer_class = ProfileSerializer
    http_method_names = ("get", "patch", "put")

    def get_object(self):
        return account.profile_of(self.request.user)
