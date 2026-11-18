from django.contrib import admin
from .models import AuthorizedCertificate, CertificateSubmission

@admin.register(AuthorizedCertificate)
class AuthorizedCertificateAdmin(admin.ModelAdmin):
    list_display = ("student_name", "registration_number", "degree", "university_name", "marks", "graduation_year", "created_at")
    search_fields = ("student_name", "registration_number", "university_name")
    list_filter = ("graduation_year", "university_name")

@admin.register(CertificateSubmission)
class CertificateSubmissionAdmin(admin.ModelAdmin):
    list_display = ("registration_number", "student", "student_name", "degree", "marks", "status", "created_at")
    list_filter = ("status", "university_name")
    search_fields = ("registration_number", "student_name", "student__email")
