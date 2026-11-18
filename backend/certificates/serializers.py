from django.conf import settings
from rest_framework import serializers
from .models import AuthorizedCertificate, CertificateSubmission

class AuthorizedCertificateSerializer(serializers.ModelSerializer):
    marks = serializers.CharField(required=False, allow_blank=True, max_length=50)
    certificate_file_url = serializers.SerializerMethodField()

    class Meta:
        model = AuthorizedCertificate
        fields = (
            "id", "student_name", "registration_number", "degree",
            "university_name", "marks", "graduation_year",
            "certificate_file", "certificate_file_url", "certificate_hash", "created_at"
        )
        read_only_fields = ("id", "certificate_hash", "created_at")

    def get_certificate_file_url(self, obj):
        if not obj.certificate_file:
            return None
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(obj.certificate_file.url)
        return obj.certificate_file.url

    def validate(self, attrs):
        for field in ["student_name", "registration_number", "degree", "university_name", "marks"]:
            if field in attrs and isinstance(attrs[field], str):
                attrs[field] = attrs[field].strip()

        reg = attrs.get("registration_number")
        uni = attrs.get("university_name")
        if reg:
            qs = AuthorizedCertificate.objects.filter(registration_number__iexact=reg)
            if uni:
                qs = qs.filter(university_name__iexact=uni)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError({
                    "registration_number": f"An authorized record for '{reg}' at '{uni}' already exists."
                })
        return attrs

class CertificateSubmissionSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    qr_code_url = serializers.SerializerMethodField()
    verification_url = serializers.SerializerMethodField()

    class Meta:
        model = CertificateSubmission
        fields = (
            "id", "reference", "file", "file_url", "student_name", "registration_number",
            "degree", "university_name", "marks", "graduation_year", "status", "certificate_hash",
            "document_verified", "verification_score", "document_analysis",
            "qr_code", "qr_code_url", "verification_url", "blockchain_tx_hash",
            "review_note", "created_at",
        )
        read_only_fields = (
            "id", "reference", "status", "certificate_hash",
            "document_verified", "verification_score", "document_analysis",
            "qr_code", "blockchain_tx_hash", "review_note", "created_at",
        )

    def get_file_url(self, obj):
        if not obj.file:
            return None
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(obj.file.url)
        return obj.file.url

    def get_qr_code_url(self, obj):
        if not obj.qr_code:
            return None
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(obj.qr_code.url)
        return obj.qr_code.url

    def get_verification_url(self, obj):
        frontend_base = getattr(settings, "FRONTEND_BASE_URL", "http://localhost:5173").rstrip("/")
        return f"{frontend_base}/verify/{obj.reference}"
