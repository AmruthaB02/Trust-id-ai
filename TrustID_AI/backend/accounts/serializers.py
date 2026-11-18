from rest_framework import serializers
from .models import User

class RegisterSerializer(serializers.ModelSerializer):
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
        if attrs["password"] != attrs.pop("confirm_password"):
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        if attrs.get("role") not in ("student", "employer"):
            raise serializers.ValidationError({"role": "Self-registration is available for students and employers only."})
        return attrs

    def create(self, validated_data):
        email = validated_data["email"].lower()
        validated_data["email"] = email
        validated_data["username"] = email
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "email", "username", "full_name", "role", "university_name", "company_name")
