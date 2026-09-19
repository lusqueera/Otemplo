from rest_framework import serializers

MONEY = {"max_digits": 14, "decimal_places": 2}
HOURS = {"max_digits": 7, "decimal_places": 2}


class StudyStatsSerializer(serializers.Serializer):
    streak = serializers.IntegerField()
    record_streak = serializers.IntegerField()
    week_hours = serializers.DecimalField(**HOURS)
    last_week_hours = serializers.DecimalField(**HOURS)
    weekly_change_pct = serializers.FloatField(allow_null=True)
    historical_daily_average = serializers.DecimalField(**HOURS)


class HabitsStatsSerializer(serializers.Serializer):
    week_consistency = serializers.FloatField()
    last_week_consistency = serializers.FloatField()
    month_consistency = serializers.FloatField()
    last_month_consistency = serializers.FloatField()
    monthly_change_pct = serializers.FloatField(allow_null=True)
    record_streak = serializers.IntegerField()
    density = serializers.ListField(child=serializers.IntegerField(min_value=0, max_value=3))


class TrainingStatsSerializer(serializers.Serializer):
    week_volume_kg = serializers.DecimalField(**MONEY)
    last_week_volume_kg = serializers.DecimalField(**MONEY)
    volume_change_kg = serializers.DecimalField(**MONEY)
    week_active_seconds = serializers.IntegerField()
    goal_active_seconds = serializers.IntegerField()
    week_sessions = serializers.IntegerField()
    avg_session_seconds = serializers.IntegerField()


class NetWorthPointSerializer(serializers.Serializer):
    month = serializers.CharField(help_text="YYYY-MM")
    net_worth = serializers.DecimalField(**MONEY)


class FinanceStatsSerializer(serializers.Serializer):
    net_worth = serializers.DecimalField(**MONEY)
    net_worth_change_pct = serializers.FloatField(allow_null=True)
    savings_change_pct = serializers.FloatField(allow_null=True)
    expense_ceiling = serializers.DecimalField(**MONEY)
