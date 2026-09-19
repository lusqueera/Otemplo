from django.db import transaction

from brain.models import Profile, User

from .avatar import remove_avatar


@transaction.atomic
def register(email: str, password: str, name: str, title: str = "") -> User:
    user = User.objects.create_user(email=email, password=password, name=name, title=title)
    Profile.objects.create(user=user)
    return user


def profile_of(user: User) -> Profile:
    profile, _ = Profile.objects.get_or_create(user=user)
    return profile


@transaction.atomic
def delete_account(user: User) -> None:
    """Exclusão de conta: apaga foto e o usuário (cascata leva todos os dados)."""
    remove_avatar(user)
    user.delete()
