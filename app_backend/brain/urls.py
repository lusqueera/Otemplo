from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from brain import views

router = DefaultRouter()
router.register("study/subjects", views.SubjectViewSet, basename="subject")
router.register("study/schedule", views.ScheduleBlockViewSet, basename="schedule")
router.register("study/flashcards", views.FlashcardViewSet, basename="flashcard")
router.register("habits", views.HabitViewSet, basename="habit")
router.register("training/workouts", views.WorkoutViewSet, basename="workout")
router.register("training/sessions", views.TrainingLogViewSet, basename="training-session")
router.register("finance/transactions", views.TransactionViewSet, basename="transaction")
router.register("finance/allocation", views.AssetClassViewSet, basename="asset-class")

auth_urls = [
    path("register/", views.RegisterView.as_view(), name="register"),
    path("token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("logout/", views.LogoutView.as_view(), name="logout"),
    path("me/", views.MeView.as_view(), name="me"),
    path("me/avatar/", views.AvatarView.as_view(), name="me-avatar"),
    path("me/password/", views.ChangePasswordView.as_view(), name="me-password"),
    path("me/profile/", views.ProfileView.as_view(), name="me-profile"),
]

urlpatterns = [
    path("auth/", include(auth_urls)),
    path("study/hours/", views.StudyHoursView.as_view(), name="study-hours"),
    path("study/sessions/", views.StudySessionView.as_view(), name="study-session"),
    path("study/stats/", views.StudyStatsView.as_view(), name="study-stats"),
    path("habits/stats/", views.HabitsStatsView.as_view(), name="habits-stats"),
    path("training/stats/", views.TrainingStatsView.as_view(), name="training-stats"),
    path("finance/stats/", views.FinanceStatsView.as_view(), name="finance-stats"),
    path("finance/evolution/", views.NetWorthEvolutionView.as_view(), name="finance-evolution"),
    path("training/week/", views.TrainingWeekView.as_view(), name="training-week"),
    path("training/tonnage/", views.TonnageView.as_view(), name="training-tonnage"),
    path("", include(router.urls)),
]
