from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = [
        ("student", "Student"),
        ("university_admin", "University Administrator"),
        ("employer", "Employer"),
    ]
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=30, choices=ROLE_CHOICES, default="student")
    full_name = models.CharField(max_length=150, blank=True)
    university_name = models.CharField(max_length=200, blank=True)
    company_name = models.CharField(max_length=200, blank=True)

    def __str__(self):
        return self.email
