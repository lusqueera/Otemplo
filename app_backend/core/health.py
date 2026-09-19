from django.db import connection
from django.http import JsonResponse


def health(_request):
    """Usado pelo deploy e por monitoramento: confirma processo e banco."""
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        return JsonResponse({"status": "ok", "database": "ok"})
    except Exception as exc:  # noqa: BLE001 — qualquer falha de banco vira 503
        return JsonResponse({"status": "degraded", "database": str(exc)}, status=503)
