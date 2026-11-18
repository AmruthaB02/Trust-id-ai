from django.db.models import Q
from rest_framework import generics, permissions, status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import AuthorizedCertificate, CertificateSubmission
from .serializers import AuthorizedCertificateSerializer, CertificateSubmissionSerializer
from .services import sha256_file, create_qr_image

class AuthorizedCertificateListCreateView(generics.ListCreateAPIView):
    serializer_class = AuthorizedCertificateSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == "university_admin":
            return AuthorizedCertificate.objects.filter(university_admin=user)
        return AuthorizedCertificate.objects.none()

    def perform_create(self, serializer):
        if self.request.user.role != "university_admin":
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only university administrators can register issuer records.")
        serializer.save(university_admin=self.request.user)

class CertificateListCreateView(generics.ListCreateAPIView):
    serializer_class = CertificateSubmissionSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        user = self.request.user
        if user.role == "university_admin":
            return CertificateSubmission.objects.all()
        return CertificateSubmission.objects.filter(student=user)

    def create(self, request, *args, **kwargs):
        if request.user.role != "student":
            return Response({"detail": "Only student accounts can submit certificates."}, status=403)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        uploaded = serializer.validated_data["file"]
        submission = serializer.save(student=request.user, student_name=serializer.validated_data.get("student_name") or request.user.full_name)

        submission.certificate_hash = sha256_file(uploaded)
        matching_records = AuthorizedCertificate.objects.filter(
            registration_number__iexact=submission.registration_number.strip(),
            degree__iexact=submission.degree.strip(),
            university_name__iexact=submission.university_name.strip(),
            graduation_year=submission.graduation_year,
        )
        if submission.student_name:
            matching_records = matching_records.filter(student_name__iexact=submission.student_name.strip())

        if matching_records.exists():
            submission.status = "verified_demo"
            submission.review_note = "Metadata matched an authorized record in the local demo. No blockchain transaction was submitted."
            submission.qr_code.save(
                f"verification-{submission.reference}.png",
                create_qr_image(submission.reference),
                save=False,
            )
        else:
            submission.status = "unverified"
            submission.review_note = "No matching authorized university record was found in the local demo. Administrator review is required."

        submission.save()
        return Response(self.get_serializer(submission).data, status=status.HTTP_201_CREATED)

class PublicVerificationView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, reference):
        try:
            item = CertificateSubmission.objects.get(reference=reference)
        except CertificateSubmission.DoesNotExist:
            return Response({"detail": "No verification record was found for this reference."}, status=404)

        return Response({
            "reference": str(item.reference),
            "status": item.status,
            "student_name": item.student_name,
            "registration_number": item.registration_number,
            "degree": item.degree,
            "university_name": item.university_name,
            "graduation_year": item.graduation_year,
            "certificate_hash": item.certificate_hash,
            "blockchain_tx_hash": item.blockchain_tx_hash or None,
            "created_at": item.created_at,
            "review_note": item.review_note,
            "verification_type": "local_demo_metadata_match",
        })

class ReportSummaryView(APIView):
    def get(self, request):
        user = request.user
        queryset = CertificateSubmission.objects.all() if user.role == "university_admin" else CertificateSubmission.objects.filter(student=user)
        return Response({
            "total_certificates": queryset.count(),
            "verified": queryset.filter(status="verified_demo").count(),
            "pending": queryset.filter(status="pending_review").count(),
            "flagged": queryset.filter(status="unverified").count(),
        })
