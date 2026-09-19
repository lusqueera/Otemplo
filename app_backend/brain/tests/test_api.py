import base64
import io
from datetime import date, timedelta

from django.urls import reverse
from PIL import Image
from rest_framework import status
from rest_framework.test import APITestCase

from brain.models import Habit, HabitLog, Profile, User
from brain.services.weeks import week_start

PASSWORD = "correct-horse-battery"


class AuthMixin:
    def setUp(self):
        self.user = User.objects.create_user(email="ana@example.com", password=PASSWORD, name="Ana")
        Profile.objects.create(user=self.user)
        self.client.force_authenticate(self.user)


class AuthTests(APITestCase):
    def test_register_returns_tokens_and_creates_profile(self):
        res = self.client.post(
            reverse("register"),
            {"email": "novo@example.com", "password": PASSWORD, "name": "Novo", "title": "Arquiteto"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.json())
        self.assertIn("access", res.json())
        self.assertEqual(res.json()["user"]["email"], "novo@example.com")
        self.assertTrue(Profile.objects.filter(user__email="novo@example.com").exists())

    def test_register_rejects_duplicate_email(self):
        User.objects.create_user(email="dup@example.com", password=PASSWORD, name="Dup")
        res = self.client.post(
            reverse("register"), {"email": "DUP@example.com", "password": PASSWORD, "name": "x"}, format="json"
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_by_email(self):
        User.objects.create_user(email="ana@example.com", password=PASSWORD, name="Ana")
        res = self.client.post(
            reverse("token_obtain_pair"), {"email": "ana@example.com", "password": PASSWORD}, format="json"
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK, res.json())
        self.assertIn("refresh", res.json())

    def test_protected_endpoint_requires_auth(self):
        self.assertEqual(self.client.get(reverse("me")).status_code, status.HTTP_401_UNAUTHORIZED)


class MeTests(AuthMixin, APITestCase):
    def test_patch_name_and_title_camel_case(self):
        res = self.client.patch(reverse("me"), {"name": "Ana Souza", "title": "Designer"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK, res.json())
        self.assertEqual(res.json()["name"], "Ana Souza")
        self.assertIn("createdAt", res.json())

    def test_avatar_upload_and_remove(self):
        buf = io.BytesIO()
        Image.new("RGB", (4, 4), "white").save(buf, format="PNG")
        payload = "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()
        res = self.client.put(reverse("me-avatar"), {"image": payload}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK, res.json())
        self.assertIn("/media/avatars/", res.json()["avatar"])
        self.user.refresh_from_db()
        self.assertTrue(self.user.avatar)

        res = self.client.delete(reverse("me-avatar"))
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.user.refresh_from_db()
        self.assertIsNone(self.user.avatar)

    def test_avatar_rejects_garbage(self):
        res = self.client.put(reverse("me-avatar"), {"image": "bm90IGFuIGltYWdl"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_profile_patch_keeps_at_least_one_curator(self):
        res = self.client.patch(reverse("me-profile"), {"quoteCurators": []}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        res = self.client.patch(reverse("me-profile"), {"quoteCurators": ["stoic"], "studyHours": 30}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK, res.json())
        self.assertEqual(res.json()["studyHours"], 30)

    def test_delete_account_cascades(self):
        Habit.objects.create(user=self.user, title="Ler")
        res = self.client.delete(reverse("me"))
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(User.objects.filter(pk=self.user.pk).exists())
        self.assertFalse(Habit.objects.exists())


class StudyTests(AuthMixin, APITestCase):
    def test_subject_crud_is_scoped_to_user(self):
        res = self.client.post(reverse("subject-list"), {"title": "Cálculo", "hoursGoal": "15"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.json())
        subject_id = res.json()["id"]

        other = User.objects.create_user(email="b@example.com", password=PASSWORD, name="B")
        self.client.force_authenticate(other)
        self.assertEqual(
            self.client.get(reverse("subject-detail", args=[subject_id])).status_code, status.HTTP_404_NOT_FOUND
        )
        self.assertEqual(self.client.get(reverse("subject-list")).json()["count"], 0)

    def test_session_logs_hours_to_day_and_subject(self):
        subject = self.client.post(reverse("subject-list"), {"title": "Arq"}, format="json").json()
        res = self.client.post(reverse("study-session"), {"seconds": 5400, "subject": subject["id"]}, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.json())

        hours = self.client.get(reverse("study-hours")).json()
        self.assertEqual(hours["week"], week_start().isoformat())
        self.assertEqual(hours["hours"][date.today().weekday()], "1.50")

        detail = self.client.get(reverse("subject-detail", args=[subject["id"]])).json()
        self.assertEqual(detail["hoursDone"], "1.50")

    def test_flashcard_review(self):
        subject = self.client.post(reverse("subject-list"), {"title": "Arq"}, format="json").json()
        card = self.client.post(
            reverse("flashcard-list"), {"subject": subject["id"], "front": "P?", "back": "R."}, format="json"
        )
        self.assertEqual(card.status_code, status.HTTP_201_CREATED, card.json())
        res = self.client.post(reverse("flashcard-review", args=[card.json()["id"]]), {"correct": True}, format="json")
        self.assertEqual(res.json()["hits"], 1)
        self.assertFalse(res.json()["due"])
        self.assertEqual(self.client.get(reverse("flashcard-list") + "?due=1").json()["count"], 0)

    def test_schedule_rejects_end_before_start(self):
        res = self.client.post(
            reverse("schedule-list"),
            {"date": "2026-09-19", "start": "15:00", "end": "14:00", "title": "x"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


class HabitTests(AuthMixin, APITestCase):
    def test_toggle_marks_today_and_updates_streak(self):
        habit = self.client.post(reverse("habit-list"), {"title": "Ler", "group": "focus"}, format="json").json()
        HabitLog.objects.create(
            habit_id=Habit.objects.get(external_id=habit["id"]).pk, date=date.today() - timedelta(days=1)
        )

        res = self.client.post(reverse("habit-toggle", args=[habit["id"]]), {}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK, res.json())
        week = res.json()["weekly"][week_start().isoformat()]
        self.assertTrue(week[date.today().weekday()])
        self.assertEqual(res.json()["streak"], 2)

        res = self.client.post(reverse("habit-toggle", args=[habit["id"]]), {}, format="json")
        self.assertFalse(res.json()["weekly"][week_start().isoformat()][date.today().weekday()])
        self.assertEqual(res.json()["streak"], 1)  # ontem continua contando

    def test_quantity_increment_completes_day(self):
        habit = self.client.post(
            reverse("habit-list"),
            {"title": "Água", "group": "body", "quantity": {"target": 500, "step": 250, "unit": "ml"}},
            format="json",
        ).json()
        self.assertEqual(habit["quantity"]["current"], 0)
        self.client.post(reverse("habit-increment", args=[habit["id"]]), {}, format="json")
        res = self.client.post(reverse("habit-increment", args=[habit["id"]]), {}, format="json")
        self.assertEqual(res.json()["quantity"]["current"], 500)
        self.assertTrue(res.json()["weekly"][week_start().isoformat()][date.today().weekday()])

    def test_list_for_past_week(self):
        habit = self.client.post(reverse("habit-list"), {"title": "Ler"}, format="json").json()
        last_monday = week_start() - timedelta(days=7)
        HabitLog.objects.create(habit=Habit.objects.get(external_id=habit["id"]), date=last_monday)
        res = self.client.get(reverse("habit-list") + f"?week={last_monday.isoformat()}")
        self.assertEqual(
            res.json()["results"][0]["weekly"],
            {last_monday.isoformat(): [True, False, False, False, False, False, False]},
        )


class TrainingTests(AuthMixin, APITestCase):
    def _workout(self):
        return self.client.post(
            reverse("workout-list"),
            {
                "title": "Treino A",
                "intensity": "high",
                "restSeconds": 90,
                "exercises": [
                    {
                        "name": "Supino",
                        "sets": 4,
                        "reps": "8",
                        "load": "80",
                        "muscle": "Peito",
                        "group": "abc",
                        "icon": "weight-lifter",
                    },
                    {"name": "HIIT", "sets": 1, "reps": "15 min", "load": "0", "group": "cardio", "icon": "run"},
                ],
            },
            format="json",
        )

    def test_nested_exercises_and_estimates(self):
        res = self._workout()
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.json())
        self.assertEqual(len(res.json()["exercises"]), 2)
        self.assertEqual(res.json()["estimatedVolumeKg"], "3200.00")  # 4 x 10 x 80
        self.assertEqual(res.json()["estimatedDurationSeconds"], 5 * (45 + 90))

    def test_finish_session_marks_week_and_resets_done(self):
        workout = self._workout().json()
        ex_id = workout["exercises"][0]["id"]
        toggled = self.client.post(reverse("workout-toggle-exercise", args=[workout["id"], ex_id]))
        self.assertTrue(toggled.json()["done"])

        res = self.client.post(
            reverse("training-session-finish"), {"workout": workout["id"], "durationSeconds": 3600}, format="json"
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.json())
        self.assertEqual(res.json()["volumeKg"], "3200.00")

        week = self.client.get(reverse("training-week")).json()
        self.assertTrue(week["done"][date.today().weekday()])
        detail = self.client.get(reverse("workout-detail", args=[workout["id"]])).json()
        self.assertFalse(detail["exercises"][0]["done"])

        tonnage = self.client.get(reverse("training-tonnage")).json()
        self.assertEqual(len(tonnage), 6)
        self.assertEqual(tonnage[-1]["volumeKg"], "3200.00")


class FinanceTests(AuthMixin, APITestCase):
    def _tx(self, kind, amount, days_ago=0):
        return self.client.post(
            reverse("transaction-list"),
            {
                "title": kind,
                "kind": kind,
                "amount": str(amount),
                "date": (date.today() - timedelta(days=days_ago)).isoformat(),
            },
            format="json",
        )

    def test_summary_and_period_filter(self):
        self._tx("income", 1000)
        self._tx("essential", 300)
        self._tx("investment", 200, days_ago=400)  # fora do mês/ano
        self.client.post(reverse("asset-class-list"), {"name": "Renda Fixa", "amount": "5000"}, format="json")

        month = self.client.get(reverse("transaction-summary")).json()
        self.assertEqual(month["income"], "1000.00")
        self.assertEqual(month["expenses"], "300.00")
        self.assertEqual(month["net"], "700.00")
        self.assertEqual(month["totalAllocation"], "5000.00")

        overview = self.client.get(reverse("transaction-summary") + "?period=overview").json()
        self.assertEqual(overview["investment"], "200.00")
        self.assertEqual(self.client.get(reverse("transaction-list") + "?period=overview").json()["count"], 3)

    def test_amount_must_be_positive(self):
        self.assertEqual(self._tx("income", -5).status_code, status.HTTP_400_BAD_REQUEST)


class StatsTests(AuthMixin, APITestCase):
    def test_study_stats_streak_and_change(self):
        subject = self.client.post(reverse("subject-list"), {"title": "Arq"}, format="json").json()
        for days_ago in (0, 1, 2):
            day = (date.today() - timedelta(days=days_ago)).isoformat()
            self.client.post(
                reverse("study-session"), {"seconds": 3600, "subject": subject["id"], "date": day}, format="json"
            )
        res = self.client.get(reverse("study-stats")).json()
        self.assertEqual(res["streak"], 3)
        self.assertEqual(res["recordStreak"], 3)
        self.assertEqual(res["historicalDailyAverage"], "1.00")

    def test_habits_stats_density_and_record(self):
        habit = self.client.post(reverse("habit-list"), {"title": "Ler"}, format="json").json()
        obj = Habit.objects.get(external_id=habit["id"])
        for days_ago in (0, 1, 2, 10):
            HabitLog.objects.create(habit=obj, date=date.today() - timedelta(days=days_ago))
        res = self.client.get(reverse("habits-stats") + "?days=30").json()
        self.assertEqual(len(res["density"]), 30)
        self.assertEqual(res["density"][-1], 3)  # hoje: 1/1 hábitos
        self.assertEqual(res["density"][-4], 0)
        self.assertEqual(res["recordStreak"], 3)

    def test_training_and_finance_stats(self):
        self.client.post(reverse("training-session-finish"), {"workout": None, "durationSeconds": 1800}, format="json")
        tr = self.client.get(reverse("training-stats")).json()
        self.assertEqual(tr["weekSessions"], 1)
        self.assertEqual(tr["avgSessionSeconds"], 1800)

        self.client.post(reverse("asset-class-list"), {"name": "RF", "amount": "1000"}, format="json")
        self.client.post(
            reverse("transaction-list"),
            {"title": "x", "kind": "income", "amount": "200", "date": date.today().isoformat()},
            format="json",
        )
        evo = self.client.get(reverse("finance-evolution") + "?months=3").json()
        self.assertEqual(len(evo), 3)
        self.assertEqual(evo[-1]["netWorth"], "1000.00")
        self.assertEqual(evo[-2]["netWorth"], "800.00")  # antes da receita deste mês
        fin = self.client.get(reverse("finance-stats")).json()
        self.assertEqual(fin["expenseCeiling"], "8500.00")
        self.assertEqual(fin["netWorthChangePct"], 25.0)
