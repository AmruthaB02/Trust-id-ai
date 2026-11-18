import hashlib
import io
from django.core.files.base import ContentFile
from PIL import Image, ImageDraw

def generate_sample_certificate_image():
    """Generates an official graphical certificate for demo purposes."""
    img = Image.new("RGB", (1200, 850), color="#fcfbfa")
    draw = ImageDraw.Draw(img)

    # Double borders
    draw.rectangle([30, 30, 1170, 820], outline="#2d226a", width=5)
    draw.rectangle([45, 45, 1155, 805], outline="#bda152", width=2)

    # Decorative header
    draw.text((600, 110), "NATIONAL TECH UNIVERSITY", fill="#2d226a", anchor="mm")
    draw.text((600, 150), "OFFICIAL ACCREDITED DEGREE CERTIFICATE", fill="#757994", anchor="mm")
    draw.line([(450, 180), (750, 180)], fill="#bda152", width=2)

    # Body
    draw.text((600, 240), "This is to officially certify that", fill="#4a4c67", anchor="mm")
    draw.text((600, 310), "ALEX MERCER", fill="#2d226a", anchor="mm")
    draw.text((600, 365), "Registration No: NTU2024CS001", fill="#5a4bc4", anchor="mm")
    draw.text((600, 430), "has successfully fulfilled the prescribed course of study and is awarded the degree of", fill="#4a4c67", anchor="mm")
    draw.text((600, 495), "Bachelor of Technology in Computer Science", fill="#2d226a", anchor="mm")
    draw.text((600, 560), "Graduated with Distinction · Marks: 9.4 CGPA", fill="#147c54", anchor="mm")
    draw.text((600, 615), "Conferred at the University Convocation · Year of Passing: 2024", fill="#757994", anchor="mm")

    # Signatures
    draw.line([(240, 720), (460, 720)], fill="#2d226a", width=2)
    draw.text((350, 740), "Dean of Academic Affairs", fill="#4a4c67", anchor="mm")

    draw.line([(740, 720), (960, 720)], fill="#2d226a", width=2)
    draw.text((850, 740), "Vice Chancellor & President", fill="#4a4c67", anchor="mm")

    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    return buffer.getvalue()

def ensure_default_data(*args, **kwargs):
    """
    Automatically creates/updates default demo accounts, institutional records,
    and verified certificate documents so anyone running the code immediately has
    live Text + Document/Image cryptographic verification working out of the box.
    """
    try:
        from .models import User
        from certificates.models import AuthorizedCertificate, CertificateSubmission
        from certificates.services import create_qr_image

        # 1. Primary Admin User
        admin_user = (
            User.objects.filter(email__iexact="admin@gmail.com").first()
            or User.objects.filter(username__iexact="admin").first()
        )
        if not admin_user:
            admin_user = User.objects.create_superuser(
                username="admin",
                email="admin@gmail.com",
                password="admin123",
                role="university_admin",
                full_name="System Administrator",
                university_name="National Tech University"
            )
        else:
            admin_user.username = "admin"
            admin_user.email = "admin@gmail.com"
            admin_user.set_password("admin123")
            admin_user.role = "university_admin"
            admin_user.is_staff = True
            admin_user.is_superuser = True
            admin_user.university_name = "National Tech University"
            if not admin_user.full_name:
                admin_user.full_name = "System Administrator"
            admin_user.save()

        # 2. Demo Student Account
        student_user = (
            User.objects.filter(email__iexact="student@example.com").first()
            or User.objects.filter(username__iexact="student").first()
        )
        if not student_user:
            student_user = User.objects.create_user(
                username="student",
                email="student@example.com",
                password="student123",
                role="student",
                full_name="Alex Mercer",
                university_name="National Tech University"
            )
        else:
            student_user.username = "student"
            student_user.email = "student@example.com"
            student_user.set_password("student123")
            student_user.role = "student"
            if not student_user.full_name:
                student_user.full_name = "Alex Mercer"
            student_user.university_name = "National Tech University"
            student_user.save()

        # 3. Demo Employer Account
        employer_user = (
            User.objects.filter(email__iexact="employer@example.com").first()
            or User.objects.filter(username__iexact="employer").first()
        )
        if not employer_user:
            employer_user = User.objects.create_user(
                username="employer",
                email="employer@example.com",
                password="employer123",
                role="employer",
                full_name="Global Recruiter",
                company_name="Apex Verification Technologies"
            )
        else:
            employer_user.username = "employer"
            employer_user.email = "employer@example.com"
            employer_user.set_password("employer123")
            employer_user.role = "employer"
            if not employer_user.full_name:
                employer_user.full_name = "Global Recruiter"
            employer_user.company_name = "Apex Verification Technologies"
            employer_user.save()

        # 4. Generate Master Certificate Bytes & Hash
        cert_bytes = generate_sample_certificate_image()
        cert_hash = hashlib.sha256(cert_bytes).hexdigest()

        # 5. Default Seed Authorized Certificate Record with Master Document
        auth_rec = AuthorizedCertificate.objects.filter(registration_number__iexact="NTU2024CS001").first()
        if not auth_rec:
            auth_rec = AuthorizedCertificate(
                university_admin=admin_user,
                student_name="Alex Mercer",
                registration_number="NTU2024CS001",
                degree="B.Tech Computer Science",
                university_name="National Tech University",
                marks="9.4 CGPA",
                graduation_year=2024,
                certificate_hash=cert_hash
            )
            auth_rec.certificate_file.save("NTU2024CS001_Alex_Mercer.png", ContentFile(cert_bytes), save=False)
            auth_rec.save()
        else:
            if not auth_rec.certificate_file or not auth_rec.certificate_hash:
                auth_rec.certificate_hash = cert_hash
                auth_rec.certificate_file.save("NTU2024CS001_Alex_Mercer.png", ContentFile(cert_bytes), save=False)
                auth_rec.save()

        # 6. Ensure Demo Student Certificate Submission is Synchronized & Verified
        student_sub = CertificateSubmission.objects.filter(registration_number__iexact="NTU2024CS001").first()
        analysis_text = (
            "Format Check: Valid PNG graphic certificate (1200x850 pixels).\n"
            "Cryptographic Check: 100% exact SHA-256 match with the university master copy.\n"
            "Visual Template Match: 100% perceptual visual similarity with university issuer master.\n"
            f"SHA-256 Digest: {cert_hash[:16]}...{cert_hash[-12:]}"
        )

        if not student_sub:
            student_sub = CertificateSubmission(
                student=student_user,
                student_name="Alex Mercer",
                registration_number="NTU2024CS001",
                degree="B.Tech Computer Science",
                university_name="National Tech University",
                marks="9.4 CGPA",
                graduation_year=2024,
                status="verified_demo",
                certificate_hash=cert_hash,
                document_verified=True,
                verification_score=100,
                document_analysis=analysis_text,
                review_note="Dual-Layer Check Passed: Metadata matched institutional record and PNG Image Certificate was cryptographically inspected & verified (Score: 100%)."
            )
            student_sub.file.save("NTU2024CS001_Alex_Mercer.png", ContentFile(cert_bytes), save=False)
            student_sub.qr_code.save(
                f"verification-{student_sub.reference}.png",
                create_qr_image(student_sub.reference),
                save=False
            )
            student_sub.save()
        else:
            student_sub.certificate_hash = cert_hash
            student_sub.document_verified = True
            student_sub.verification_score = 100
            student_sub.document_analysis = analysis_text
            student_sub.status = "verified_demo"
            student_sub.review_note = "Dual-Layer Check Passed: Metadata matched institutional record and PNG Image Certificate was cryptographically inspected & verified (Score: 100%)."
            if not student_sub.file:
                student_sub.file.save("NTU2024CS001_Alex_Mercer.png", ContentFile(cert_bytes), save=False)
            if not student_sub.qr_code:
                student_sub.qr_code.save(
                    f"verification-{student_sub.reference}.png",
                    create_qr_image(student_sub.reference),
                    save=False
                )
            student_sub.save()

    except Exception:
        # Ignore during early migrations when tables are not yet created
        pass
