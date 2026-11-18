from django.contrib import admin
from .models import AuthorizedCertificate, CertificateSubmission

@admin.register(AuthorizedCertificate)
class AuthorizedCertificateAdmin(admin.ModelAdmin):
    list_display = ("student_name", "registration_number", "degree", "university_name", "graduation_year")
    search_fields = ("student_name", "registration_number", "university_name")

@admin.register(CertificateSubmission)
class CertificateSubmissionAdmin(admin.ModelAdmin):
    list_display = ("registration_number", "student", "status", "created_at")
    list_filter = ("status",)
    search_fields = ("registration_number", "student__email")
