import uuid
from django.conf import settings
from django.db import models

class AuthorizedCertificate(models.Model):
    university_admin = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="authorized_records")
    student_name = models.CharField(max_length=150)
    registration_number = models.CharField(max_length=100, db_index=True)
    degree = models.CharField(max_length=200)
    university_name = models.CharField(max_length=200)
    marks = models.CharField(max_length=50, blank=True)
    graduation_year = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.registration_number} - {self.student_name}"

class CertificateSubmission(models.Model):
    STATUS_CHOICES = [
        ("pending_review", "Pending review"),
        ("verified_demo", "Verified (local demo match)"),
        ("unverified", "Unverified"),
    ]
    reference = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="certificate_submissions")
    file = models.FileField(upload_to="certificates/")
    student_name = models.CharField(max_length=150, blank=True)
    registration_number = models.CharField(max_length=100)
    degree = models.CharField(max_length=200)
    university_name = models.CharField(max_length=200)
    graduation_year = models.PositiveIntegerField()
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default="pending_review")
    certificate_hash = models.CharField(max_length=64, blank=True)
    qr_code = models.ImageField(upload_to="qr_codes/", blank=True)
    blockchain_tx_hash = models.CharField(max_length=150, blank=True)
    review_note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.registration_number} - {self.status}"
