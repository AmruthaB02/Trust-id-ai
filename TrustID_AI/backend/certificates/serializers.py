from rest_framework import serializers
from .models import AuthorizedCertificate, CertificateSubmission

class AuthorizedCertificateSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuthorizedCertificate
        fields = ("id", "student_name", "registration_number", "degree", "university_name", "marks", "graduation_year", "created_at")
        read_only_fields = ("id", "created_at")

class CertificateSubmissionSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    qr_code_url = serializers.SerializerMethodField()
    verification_url = serializers.SerializerMethodField()
    class Meta:
        model = CertificateSubmission
        fields = (
            "id", "reference", "file", "file_url", "student_name", "registration_number",
            "degree", "university_name", "graduation_year", "status", "certificate_hash",
            "qr_code", "qr_code_url", "verification_url", "blockchain_tx_hash",
            "review_note", "created_at",
        )
        read_only_fields = (
            "id", "reference", "status", "certificate_hash", "qr_code",
            "blockchain_tx_hash", "review_note", "created_at",
        )

    def get_file_url(self, obj):
        request = self.context.get("request")
        return request.build_absolute_uri(obj.file.url) if request and obj.file else None

    def get_qr_code_url(self, obj):
        request = self.context.get("request")
        return request.build_absolute_uri(obj.qr_code.url) if request and obj.qr_code else None

    def get_verification_url(self, obj):
        request = self.context.get("request")
        base = request.build_absolute_uri("/") if request else "http://localhost:5173/"
        return f"{base.rstrip('/')}/verify/{obj.reference}"
