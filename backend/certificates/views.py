from django.db.models import Q
from rest_framework import generics, permissions, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import AuthorizedCertificate, CertificateSubmission
from .serializers import AuthorizedCertificateSerializer, CertificateSubmissionSerializer
from .services import sha256_file, create_qr_image, verify_document_content

class AuthorizedCertificateListCreateView(generics.ListCreateAPIView):
    serializer_class = AuthorizedCertificateSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return AuthorizedCertificate.objects.none()
        if user.is_superuser:
            return AuthorizedCertificate.objects.all()
        if user.role == "university_admin":
            if user.university_name:
                return AuthorizedCertificate.objects.filter(
                    Q(university_admin=user) | Q(university_name__iexact=user.university_name.strip())
                )
            return AuthorizedCertificate.objects.all()
        return AuthorizedCertificate.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        if user.role != "university_admin" and not user.is_superuser:
            raise PermissionDenied("Only university administrators can register issuer records.")
        cert_file = serializer.validated_data.get("certificate_file")
        file_hash = sha256_file(cert_file) if cert_file else ""
        serializer.save(university_admin=user, certificate_hash=file_hash)

class AuthorizedCertificateDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AuthorizedCertificateSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return AuthorizedCertificate.objects.none()
        if user.is_superuser:
            return AuthorizedCertificate.objects.all()
        if user.role == "university_admin":
            if user.university_name:
                return AuthorizedCertificate.objects.filter(
                    Q(university_admin=user) | Q(university_name__iexact=user.university_name.strip())
                )
            return AuthorizedCertificate.objects.all()
        return AuthorizedCertificate.objects.none()

    def perform_update(self, serializer):
        cert_file = serializer.validated_data.get("certificate_file")
        if cert_file:
            file_hash = sha256_file(cert_file)
            serializer.save(certificate_hash=file_hash)
        else:
            serializer.save()

class CertificateListCreateView(generics.ListCreateAPIView):
    serializer_class = CertificateSubmissionSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        user = self.request.user
        if user.role == "university_admin" or user.is_superuser:
            return CertificateSubmission.objects.all()
        if user.role == "employer":
            return CertificateSubmission.objects.filter(status="verified_demo")
        return CertificateSubmission.objects.filter(student=user)

    def create(self, request, *args, **kwargs):
        if request.user.role != "student":
            return Response({"detail": "Only student accounts can submit certificates."}, status=403)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        uploaded = serializer.validated_data["file"]
        submission = serializer.save(
            student=request.user,
            student_name=serializer.validated_data.get("student_name") or request.user.full_name,
            marks=serializer.validated_data.get("marks", "")
        )

        # 1. Compute Document SHA-256 Checksum
        submission.certificate_hash = sha256_file(uploaded)

        # 2. Metadata Cross-Check against Authorized Institutional Registry
        matching_records = AuthorizedCertificate.objects.filter(
            registration_number__iexact=submission.registration_number.strip(),
            degree__iexact=submission.degree.strip(),
            university_name__iexact=submission.university_name.strip(),
            graduation_year=submission.graduation_year,
        )
        if submission.student_name:
            matching_records = matching_records.filter(student_name__iexact=submission.student_name.strip())

        matched_record = matching_records.first() if matching_records.exists() else None

        # 3. Deep Document & Image/PDF Inspection (Content, Hash, Visual, Structure)
        doc_result = verify_document_content(
            uploaded,
            matched_record,
            submission.student_name,
            submission.registration_number,
            submission.degree,
            submission.university_name
        )

        submission.document_verified = doc_result["document_verified"]
        submission.verification_score = doc_result["verification_score"]
        submission.document_analysis = doc_result["analysis_notes"]

        if matched_record and doc_result["document_verified"]:
            if not submission.marks and matched_record.marks:
                submission.marks = matched_record.marks
            submission.status = "verified_demo"
            submission.review_note = (
                f"Dual-Layer Verification Passed: Metadata matched institutional records and {doc_result['document_type']} "
                f"was cryptographically authenticated (Score: {doc_result['verification_score']}%)."
            )
            submission.qr_code.save(
                f"verification-{submission.reference}.png",
                create_qr_image(submission.reference),
                save=False,
            )
        elif matched_record and not doc_result["document_verified"]:
            # Critical Security Protection: Text matched, but the uploaded document/image was different or altered!
            submission.status = "unverified"
            submission.review_note = (
                f"DOCUMENT REJECTED / MISMATCH: While text metadata matched an authorized record, the uploaded {doc_result['document_type']} "
                f"failed verification ({doc_result.get('failure_reason', 'Uploaded document differs from authorized master copy')}). "
                f"Integrity Score: {doc_result['verification_score']}%. Administrator review is required."
            )
        else:
            submission.status = "unverified"
            submission.review_note = (
                "No matching authorized university record was found in the institutional registry. "
                "Administrator review is required."
            )

        submission.save()
        return Response(self.get_serializer(submission).data, status=status.HTTP_201_CREATED)

class PublicVerificationView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, reference):
        ref_clean = str(reference).strip()
        item = None

        # 1. Try matching by UUID reference
        try:
            import uuid
            uuid_obj = uuid.UUID(ref_clean)
            item = CertificateSubmission.objects.filter(reference=uuid_obj).first()
        except (ValueError, TypeError):
            pass

        # 2. Try matching by SHA-256 certificate hash
        if not item:
            item = CertificateSubmission.objects.filter(certificate_hash__iexact=ref_clean).first()

        # 3. Try matching by Registration / Roll Number
        if not item:
            item = CertificateSubmission.objects.filter(registration_number__iexact=ref_clean).first()

        # 4. If not found in student submissions, check the AuthorizedCertificate registry
        if not item:
            auth_rec = (
                AuthorizedCertificate.objects.filter(certificate_hash__iexact=ref_clean).first()
                or AuthorizedCertificate.objects.filter(registration_number__iexact=ref_clean).first()
            )
            if auth_rec:
                file_url = request.build_absolute_uri(auth_rec.certificate_file.url) if auth_rec.certificate_file else None
                return Response({
                    "reference": auth_rec.registration_number,
                    "status": "verified_demo",
                    "student_name": auth_rec.student_name,
                    "registration_number": auth_rec.registration_number,
                    "degree": auth_rec.degree,
                    "university_name": auth_rec.university_name,
                    "marks": auth_rec.marks or None,
                    "graduation_year": auth_rec.graduation_year,
                    "certificate_hash": auth_rec.certificate_hash,
                    "document_verified": bool(auth_rec.certificate_file),
                    "verification_score": 100 if auth_rec.certificate_file else 95,
                    "document_analysis": (
                        "Institutional Ground Truth Record: Authenticated directly from authorized university database registry.\n"
                        f"Master Document Hash: {auth_rec.certificate_hash or 'Registered in ledger'}"
                    ),
                    "qr_code_url": None,
                    "file_url": file_url,
                    "blockchain_tx_hash": None,
                    "created_at": auth_rec.created_at,
                    "review_note": "Record verified directly from authorized institutional registry.",
                    "verification_type": "authorized_registry_match",
                })

        if not item:
            return Response({"detail": f"No verification record found for '{ref_clean}'."}, status=404)

        qr_url = request.build_absolute_uri(item.qr_code.url) if item.qr_code else None
        file_url = request.build_absolute_uri(item.file.url) if item.file else None

        return Response({
            "reference": str(item.reference),
            "status": item.status,
            "student_name": item.student_name,
            "registration_number": item.registration_number,
            "degree": item.degree,
            "university_name": item.university_name,
            "marks": item.marks or None,
            "graduation_year": item.graduation_year,
            "certificate_hash": item.certificate_hash,
            "document_verified": item.document_verified,
            "verification_score": item.verification_score,
            "document_analysis": item.document_analysis,
            "qr_code_url": qr_url,
            "file_url": file_url,
            "blockchain_tx_hash": item.blockchain_tx_hash or None,
            "created_at": item.created_at,
            "review_note": item.review_note,
            "verification_type": "dual_layer_text_and_document_match",
        })

class ReportSummaryView(APIView):
    def get(self, request):
        user = request.user
        if user.role == "student":
            queryset = CertificateSubmission.objects.filter(student=user)
        else:
            queryset = CertificateSubmission.objects.all()

        return Response({
            "total_certificates": queryset.count(),
            "verified": queryset.filter(status="verified_demo").count(),
            "pending": queryset.filter(status="pending_review").count(),
            "flagged": queryset.filter(status="unverified").count(),
        })
