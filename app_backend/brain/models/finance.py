from django.db import models

from .owned import OwnedModel


class Transaction(OwnedModel):
    class Kind(models.TextChoices):
        INCOME = "income", "Receita"
        ESSENTIAL = "essential", "Despesa Essencial"
        INVESTMENT = "investment", "Investimento"
        LIFESTYLE = "lifestyle", "Estilo de Vida"

    title = models.CharField(max_length=120)
    category = models.CharField(max_length=80, blank=True)
    kind = models.CharField(max_length=12, choices=Kind.choices)
    amount = models.DecimalField(max_digits=12, decimal_places=2, help_text="Sempre positivo; `kind` define o sinal.")
    date = models.DateField()
    icon = models.CharField(max_length=40, default="cash-multiple")

    class Meta:
        db_table = "finance_transactions"
        ordering = ("-date", "-created_at")

    def __str__(self):
        return f"{self.date} {self.title} {self.amount}"

    @property
    def is_income(self) -> bool:
        return self.kind == self.Kind.INCOME


class AssetClass(OwnedModel):
    """Classe de ativo da alocação patrimonial."""

    name = models.CharField(max_length=80)
    amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)

    class Meta:
        db_table = "finance_asset_classes"
        ordering = ("-amount",)

    def __str__(self):
        return self.name
