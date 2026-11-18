from rest_framework import serializers
from .models import User

class RegisterSerializer(serializers.ModelSerializer):
    username = serializers.CharField(required=False, allow_blank=True, max_length=150)
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = (
            "id", "username", "email", "password", "confirm_password",
            "full_name", "role", "university_name", "company_name",
        )
        read_only_fields = ("id",)

    def validate(self, attrs):
        if attrs.get("password") != attrs.pop("confirm_password", None):
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        if attrs.get("role") not in ("student", "employer"):
            raise serializers.ValidationError({"role": "Self-registration is available for students and employers only."})

        email = (attrs.get("email") or "").strip().lower()
        if not email:
            raise serializers.ValidationError({"email": "Email address is required."})
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError({"email": "An account with this email already exists."})

        username = (attrs.get("username") or "").strip()
        if not username:
            username = email
        elif User.objects.filter(username__iexact=username).exists():
            raise serializers.ValidationError({"username": "An account with this username already exists."})

        attrs["email"] = email
        attrs["username"] = username
        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

class ProfileSerializer(serializers.ModelSerializer):
    current_password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    new_password = serializers.CharField(write_only=True, required=False, allow_blank=True, min_length=6)

    class Meta:
        model = User
        fields = (
            "id", "email", "username", "full_name", "role",
            "university_name", "company_name", "current_password", "new_password"
        )
        read_only_fields = ("id", "role")

    def validate_email(self, value):
        val = (value or "").strip().lower()
        if not val:
            raise serializers.ValidationError("Email cannot be blank.")
        user = self.instance
        if user and User.objects.filter(email__iexact=val).exclude(pk=user.pk).exists():
            raise serializers.ValidationError("This email is already registered to another account.")
        return val

    def validate_username(self, value):
        val = (value or "").strip()
        if not val:
            raise serializers.ValidationError("Username cannot be blank.")
        user = self.instance
        if user and User.objects.filter(username__iexact=val).exclude(pk=user.pk).exists():
            raise serializers.ValidationError("This username is already taken.")
        return val

    def update(self, instance, validated_data):
        current_password = validated_data.pop("current_password", None)
        new_password = validated_data.pop("new_password", None)

        if new_password:
            if not current_password:
                raise serializers.ValidationError({"current_password": "Current password is required to set a new password."})
            if not instance.check_password(current_password):
                raise serializers.ValidationError({"current_password": "Current password is incorrect."})
            instance.set_password(new_password)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        return instance
