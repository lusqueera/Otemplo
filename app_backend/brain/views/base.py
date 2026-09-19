from rest_framework import viewsets


class OwnedViewSet(viewsets.ModelViewSet):
    """CRUD restrito aos registros do usuário autenticado, endereçados pelo `external_id`."""

    lookup_field = "external_id"
    lookup_url_kwarg = "id"

    def get_queryset(self):
        return super().get_queryset().filter(user=self.request.user)
