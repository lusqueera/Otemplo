from rest_framework.pagination import PageNumberPagination


class DefaultPagination(PageNumberPagination):
    """`?page_size=` opcional (até 500) — os dados por usuário são pequenos e o app carrega tudo de uma vez."""

    page_size = 50
    page_size_query_param = "page_size"
    max_page_size = 500
