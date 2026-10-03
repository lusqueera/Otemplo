"""Relacionamentos com o usuário passam de `user_id` (bigint) para `user_uuid` (UUID).

Para cada tabela: cria `user_uuid_new` (FK → users.user_uuid), copia os valores via join com
`users.id`, remove o `user_id` antigo e renomeia a coluna nova para `user_uuid`.
"""

import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models

OWNED = ["assetclass", "flashcard", "habit", "scheduleblock", "studylog", "subject", "traininglog", "transaction", "workout"]
ALL = [*OWNED, "profile"]


def fill_user_uuid(apps, schema_editor):
    User = apps.get_model("brain", "User")
    for user in User.objects.filter(user_uuid__isnull=True):
        user.user_uuid = uuid.uuid4()
        user.save(update_fields=["user_uuid"])


def copy_user_uuid(apps, schema_editor):
    qn = schema_editor.quote_name
    users = qn(apps.get_model("brain", "User")._meta.db_table)
    with schema_editor.connection.cursor() as cursor:
        for name in ALL:
            table = qn(apps.get_model("brain", name)._meta.db_table)
            cursor.execute(
                f"UPDATE {table} t SET user_uuid_new = u.user_uuid FROM {users} u WHERE u.id = t.user_id"  # noqa: S608
            )


def fk(name, *, null, related_name):
    field = models.OneToOneField if name == "profile" else models.ForeignKey
    return field(
        null=null,
        on_delete=django.db.models.deletion.CASCADE,
        related_name=related_name,
        to=settings.AUTH_USER_MODEL,
        to_field="user_uuid",
        db_column="user_uuid_new" if null else "user_uuid",
    )


def per_model(step):
    return [op for name in ALL for op in step(name)]


class Migration(migrations.Migration):
    dependencies = [
        ("brain", "0003_profile_expense_ceiling"),
    ]

    operations = [
        migrations.AddField("user", "user_uuid", models.UUIDField(editable=False, null=True)),
        migrations.RunPython(fill_user_uuid, migrations.RunPython.noop),
        migrations.AlterField("user", "user_uuid", models.UUIDField(default=uuid.uuid4, editable=False, unique=True)),
        migrations.RemoveConstraint("studylog", "uniq_study_log_user_date"),
        *per_model(lambda n: [migrations.AddField(n, "user_new", fk(n, null=True, related_name="+"))]),
        migrations.RunPython(copy_user_uuid, migrations.RunPython.noop),
        *per_model(lambda n: [migrations.RemoveField(n, "user")]),
        *per_model(lambda n: [migrations.AlterField(n, "user_new", fk(n, null=False, related_name="+"))]),
        *per_model(lambda n: [migrations.RenameField(n, "user_new", "user")]),
        *per_model(
            lambda n: [
                migrations.AlterField(
                    n, "user", fk(n, null=False, related_name="profile" if n == "profile" else "+")
                )
            ]
        ),
        migrations.AddConstraint(
            "studylog", models.UniqueConstraint(fields=("user", "date"), name="uniq_study_log_user_date")
        ),
    ]
