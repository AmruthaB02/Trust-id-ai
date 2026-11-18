from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ("TrustID profile", {"fields": ("role", "full_name", "university_name", "company_name")}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ("TrustID profile", {"fields": ("email", "role", "full_name")}),
    )
    list_display = ("username", "email", "full_name", "role", "is_staff")
