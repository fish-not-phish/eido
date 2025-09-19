from django.db import models

class SiteSetting(models.Model):
    allow_registration = models.BooleanField(default=True)

    def __str__(self):
        return f"Allow Registration: {self.allow_registration}"

    @classmethod
    def get_settings(cls):
        obj, _ = cls.objects.get_or_create(id=1)
        return obj
