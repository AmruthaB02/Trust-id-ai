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
    class Meta:
        model = User
        fields = ("id", "email", "username", "full_name", "role", "university_name", "company_name")
