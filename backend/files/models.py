from django.conf import settings
from django.db import models
from workspaces.models import Workspace
import uuid

class File(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="files")
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name="files")
    name = models.CharField(max_length=255)
    code_content = models.TextField(blank=True, default="")
    whiteboard_state = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return f"[{self.workspace.name}] {self.name}"
