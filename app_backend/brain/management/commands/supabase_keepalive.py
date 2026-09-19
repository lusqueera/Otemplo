"""Toca o banco e o Storage do Supabase para o projeto não ser pausado por inatividade (plano free)."""

from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.core.management.base import BaseCommand
from django.db import connection
from django.utils import timezone


class Command(BaseCommand):
    help = "Executa uma consulta no banco e um upload/remoção no Storage para manter o projeto Supabase ativo."

    def handle(self, *args, **options):
        now = timezone.now().isoformat()

        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        self.stdout.write(f"[{now}] banco: ok")

        # Só faz sentido quando o storage remoto está configurado; no local é inofensivo
        name = default_storage.save("healthcheck/keepalive.txt", ContentFile(now.encode()))
        default_storage.delete(name)
        self.stdout.write(f"[{now}] storage: ok ({type(default_storage).__name__})")
