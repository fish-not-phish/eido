# workspaces/models.py
from django.conf import settings
from django.db import models
import uuid

class Workspace(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="owned_workspaces",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Membership(models.Model):
    ROLE_OWNER = "owner"
    ROLE_ADMIN = "admin"
    ROLE_MEMBER = "member"
    ROLE_CHOICES = [
        (ROLE_OWNER, "Owner"),
        (ROLE_ADMIN, "Admin"),
        (ROLE_MEMBER, "Member"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name="memberships")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_MEMBER)

    can_read = models.BooleanField(default=True)
    can_write = models.BooleanField(default=True)
    can_delete = models.BooleanField(default=False)

    class Meta:
        unique_together = ("user", "workspace")

    def __str__(self):
        return f"{self.user} in {self.workspace} ({self.role})"

    @property
    def is_owner(self) -> bool:
        return self.role == self.ROLE_OWNER

    @property
    def is_admin(self) -> bool:
        return self.role == self.ROLE_ADMIN
