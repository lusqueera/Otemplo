from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from brain.models import (
    AssetClass,
    Exercise,
    Flashcard,
    Habit,
    HabitLog,
    Profile,
    ScheduleBlock,
    StudyLog,
    Subject,
    TrainingLog,
    Transaction,
    User,
    Workout,
)


class ProfileInline(admin.StackedInline):
    model = Profile
    can_delete = False


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    ordering = ("email",)
    list_display = ("email", "name", "title", "is_staff", "is_active", "created_at")
    search_fields = ("email", "name")
    readonly_fields = ("external_id", "last_login", "created_at", "updated_at")
    inlines = (ProfileInline,)
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Perfil", {"fields": ("name", "title", "avatar", "external_id")}),
        ("Permissões", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Datas", {"fields": ("last_login", "created_at", "updated_at")}),
    )
    add_fieldsets = ((None, {"classes": ("wide",), "fields": ("email", "name", "password1", "password2")}),)


class OwnedAdmin(admin.ModelAdmin):
    readonly_fields = ("external_id", "created_at", "updated_at")
    list_select_related = ("user",)
    search_fields = ("user__email",)
    autocomplete_fields = ("user",)


@admin.register(Subject)
class SubjectAdmin(OwnedAdmin):
    list_display = ("title", "module", "priority", "hours_done", "hours_goal", "user")
    list_filter = ("priority",)


@admin.register(ScheduleBlock)
class ScheduleBlockAdmin(OwnedAdmin):
    list_display = ("date", "start", "end", "title", "status", "user")
    list_filter = ("status",)


@admin.register(Flashcard)
class FlashcardAdmin(OwnedAdmin):
    list_display = ("front", "subject", "due", "hits", "misses", "user")
    list_filter = ("due",)


@admin.register(StudyLog)
class StudyLogAdmin(OwnedAdmin):
    list_display = ("date", "hours", "user")


class HabitLogInline(admin.TabularInline):
    model = HabitLog
    extra = 0


@admin.register(Habit)
class HabitAdmin(OwnedAdmin):
    list_display = ("title", "group", "streak", "quantity_target", "user")
    list_filter = ("group",)
    inlines = (HabitLogInline,)


class ExerciseInline(admin.TabularInline):
    model = Exercise
    extra = 0


@admin.register(Workout)
class WorkoutAdmin(OwnedAdmin):
    list_display = ("title", "intensity", "time", "user")
    list_filter = ("intensity",)
    inlines = (ExerciseInline,)


@admin.register(TrainingLog)
class TrainingLogAdmin(OwnedAdmin):
    list_display = ("date", "workout", "duration_seconds", "volume_kg", "user")


@admin.register(Transaction)
class TransactionAdmin(OwnedAdmin):
    list_display = ("date", "title", "kind", "amount", "user")
    list_filter = ("kind",)


@admin.register(AssetClass)
class AssetClassAdmin(OwnedAdmin):
    list_display = ("name", "amount", "user")
