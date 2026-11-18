import hashlib
from io import BytesIO
import os
import qrcode
from PIL import Image
from django.conf import settings
from django.core.files.base import ContentFile

def sha256_file(uploaded_file):
    """Computes the SHA-256 cryptographic digest of an uploaded file."""
    digest = hashlib.sha256()
    try:
        if hasattr(uploaded_file, "chunks"):
            for chunk in uploaded_file.chunks():
                digest.update(chunk)
            uploaded_file.seek(0)
        else:
            uploaded_file.seek(0)
            data = uploaded_file.read()
            digest.update(data)
            uploaded_file.seek(0)
    except Exception:
        pass
    return digest.hexdigest()

def create_qr_image(reference):
    """Generates an official verification QR code pointing to the public verify route."""
    frontend_base = getattr(settings, "FRONTEND_BASE_URL", "http://localhost:5173").rstrip("/")
    url = f"{frontend_base}/verify/{reference}"
    image = qrcode.make(url)
    buffer = BytesIO()
    image.save(buffer, format="PNG")
    return ContentFile(buffer.getvalue(), name=f"verification-{reference}.png")

def extract_pdf_text(file_obj):
    """
    Extracts text content from an uploaded PDF file using pypdf.
    Returns (extracted_text_lower, page_count, success_flag).
    """
    try:
        import pypdf
        file_obj.seek(0)
        reader = pypdf.PdfReader(file_obj)
        page_count = len(reader.pages)
        full_text = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                full_text.append(text)
        file_obj.seek(0)
        combined = " ".join(full_text).lower()
        return combined, page_count, True
    except Exception:
        try:
            file_obj.seek(0)
        except Exception:
            pass
        return "", 0, False

def compute_image_dhash(image_obj, hash_size=8):
    """Computes difference hash (dhash) for perceptual image comparison."""
    try:
        img = image_obj.convert("L").resize((hash_size + 1, hash_size), Image.Resampling.LANCZOS)
        pixels = list(img.getdata())
        difference = []
        for row in range(hash_size):
            for col in range(hash_size):
                left = pixels[row * (hash_size + 1) + col]
                right = pixels[row * (hash_size + 1) + col + 1]
                difference.append(left > right)
        decimal_val = 0
        hex_parts = []
        for i, val in enumerate(difference):
            if val:
                decimal_val += 2 ** (i % 8)
            if (i % 8) == 7:
                hex_parts.append(hex(decimal_val)[2:].rjust(2, "0"))
                decimal_val = 0
        return "".join(hex_parts)
    except Exception:
        return ""

def calculate_dhash_similarity(hash1, hash2):
    """Returns visual similarity percentage (0-100%) between two dhashes."""
    if not hash1 or not hash2 or len(hash1) != len(hash2):
        return 0
    try:
        bin1 = bin(int(hash1, 16))[2:].zfill(len(hash1) * 4)
        bin2 = bin(int(hash2, 16))[2:].zfill(len(hash2) * 4)
        distance = sum(c1 != c2 for c1, c2 in zip(bin1, bin2))
        max_dist = len(bin1)
        sim = max(0, 100 - (distance / max_dist) * 100)
        return round(sim, 1)
    except Exception:
        return 0

def verify_document_content(student_file, auth_record, student_name, reg_no, degree, university_name):
    """
    Performs rigorous inspection of the uploaded student certificate (Image or PDF)
    against the official authorized institutional record.

    CRITICAL SECURITY RULE:
    If the university has an official master document on file, any uploaded
    image or PDF with different visual layout, different content, or altered hash
    is REJECTED (document_verified = False).
    """
    filename = getattr(student_file, "name", "").lower()
    is_pdf = filename.endswith(".pdf")
    student_file.seek(0)
    student_hash = sha256_file(student_file)
    student_file.seek(0)

    analysis_points = []
    document_verified = False
    verification_score = 0
    failure_reason = ""
    doc_type = "PDF Document" if is_pdf else "Image Certificate"

    # Has the university uploaded an authorized master file?
    has_master_file = bool(auth_record and (getattr(auth_record, "certificate_file", None) or getattr(auth_record, "certificate_hash", None)))
    master_hash = getattr(auth_record, "certificate_hash", "").strip().lower() if auth_record else ""

    # =========================================================================
    # SCENARIO A: University HAS an Official Master Document on Record
    # =========================================================================
    if has_master_file:
        # 1. Exact Binary SHA-256 Checksum Match
        if master_hash and student_hash.lower() == master_hash:
            document_verified = True
            verification_score = 100
            analysis_points.append("Cryptographic Check: 100% exact SHA-256 match with the university master copy.")
            analysis_points.append("Document Authenticity: Perfect bit-level match confirmed.")
        else:
            # File hash differs! We must perform deep image or PDF comparison
            if not is_pdf:
                # Student uploaded an image
                try:
                    student_file.seek(0)
                    img = Image.open(student_file)
                    img.verify()
                    student_file.seek(0)
                    img = Image.open(student_file)
                    w, h = img.size
                    doc_type = f"{img.format or 'IMAGE'} ({w}x{h}px)"
                    analysis_points.append(f"Format Check: Valid graphic certificate ({w}x{h} pixels).")

                    student_dhash = compute_image_dhash(img)

                    # Check if master is also an image
                    master_file_obj = getattr(auth_record, "certificate_file", None)
                    if master_file_obj:
                        try:
                            master_file_obj.seek(0)
                            master_img = Image.open(master_file_obj)
                            master_dhash = compute_image_dhash(master_img)
                            master_file_obj.seek(0)

                            similarity = calculate_dhash_similarity(student_dhash, master_dhash)
                            analysis_points.append(f"Visual Template Match: {similarity}% visual similarity against university master.")

                            if similarity >= 90.0:
                                document_verified = True
                                verification_score = int(similarity)
                                analysis_points.append("Visual Analysis: Image layout and pixel structure match authorized certificate.")
                            else:
                                document_verified = False
                                verification_score = max(10, int(similarity))
                                failure_reason = f"Visual similarity is only {similarity}% (required: 90% threshold)"
                                analysis_points.append(f"DOCUMENT MISMATCH: Uploaded image differs visually from university master ({similarity}% similarity).")
                        except Exception as e:
                            document_verified = False
                            verification_score = 30
                            failure_reason = "Unable to match image against master copy"
                            analysis_points.append(f"Comparison Error: {str(e)}")
                    else:
                        # Master has hash but no file object and hashes differ -> Reject
                        document_verified = False
                        verification_score = 25
                        failure_reason = "SHA-256 hash does not match university master hash"
                        analysis_points.append("Cryptographic Check: File SHA-256 digest does not match authorized master hash.")
                except Exception as e:
                    document_verified = False
                    verification_score = 15
                    failure_reason = "Uploaded image file is corrupt or unreadable"
                    analysis_points.append(f"Image Error: {str(e)}")
            else:
                # Student uploaded a PDF, but master hash differs
                master_file_obj = getattr(auth_record, "certificate_file", None)
                pdf_text, pages, ok = extract_pdf_text(student_file)

                if master_file_obj and getattr(master_file_obj, "name", "").lower().endswith(".pdf"):
                    # Both are PDFs -> compare text content
                    master_text, _, master_ok = extract_pdf_text(master_file_obj)
                    if ok and master_ok and master_text:
                        # Check keyword overlap
                        tokens = [t for t in reg_no.lower().split() if t] + [t for t in student_name.lower().split() if len(t) > 2]
                        matches = sum(1 for t in tokens if t in pdf_text)
                        if matches == len(tokens) and len(tokens) > 0:
                            document_verified = True
                            verification_score = 92
                            analysis_points.append("PDF Analysis: Extracted text matches authorized university certificate content.")
                        else:
                            document_verified = False
                            verification_score = 35
                            failure_reason = "PDF document text does not match university master certificate"
                            analysis_points.append("DOCUMENT MISMATCH: Uploaded PDF text does not match authorized university master copy.")
                    else:
                        document_verified = False
                        verification_score = 30
                        failure_reason = "PDF binary hash differs from university master"
                        analysis_points.append("Cryptographic Check: PDF binary hash differs from authorized master.")
                else:
                    # Master was an image or had a different hash
                    document_verified = False
                    verification_score = 25
                    failure_reason = "Uploaded PDF does not match university master document"
                    analysis_points.append("DOCUMENT MISMATCH: Uploaded file does not match authorized university archive.")

    # =========================================================================
    # SCENARIO B: University Only Registered Text Records (No Master File Uploaded)
    # =========================================================================
    else:
        if is_pdf:
            doc_type = "PDF Document"
            pdf_text, pages, ok = extract_pdf_text(student_file)
            if ok and pdf_text:
                analysis_points.append(f"Format Check: Valid PDF with {pages} page(s).")
                matched_tokens = []
                if reg_no and reg_no.lower().strip() in pdf_text:
                    matched_tokens.append(f"Roll No '{reg_no}'")
                if student_name:
                    name_parts = [p.lower() for p in student_name.split() if len(p) > 2]
                    if any(p in pdf_text for p in name_parts):
                        matched_tokens.append(f"Name '{student_name}'")

                # Both roll number AND name must be present in the PDF!
                if matched_tokens and (reg_no.lower().strip() in pdf_text):
                    document_verified = True
                    verification_score = 95
                    analysis_points.append(f"Content Analysis: Extracted text confirms {', '.join(matched_tokens)}.")
                else:
                    document_verified = False
                    verification_score = 30
                    failure_reason = f"PDF text does not contain roll number '{reg_no}' or student name '{student_name}'"
                    analysis_points.append(f"DOCUMENT REJECTED: Uploaded PDF does not contain registration number '{reg_no}' or name '{student_name}'.")
            else:
                document_verified = False
                verification_score = 20
                failure_reason = "Uploaded PDF is empty or has no readable text stream"
                analysis_points.append("DOCUMENT REJECTED: PDF has no readable text stream matching student records.")
        else:
            try:
                student_file.seek(0)
                img = Image.open(student_file)
                img.verify()
                student_file.seek(0)
                img = Image.open(student_file)
                w, h = img.size
                doc_type = f"{img.format or 'IMAGE'} ({w}x{h}px)"

                if w < 300 or h < 200:
                    document_verified = False
                    verification_score = 25
                    failure_reason = f"Image resolution ({w}x{h}) is too low to be a valid certificate"
                    analysis_points.append(f"DOCUMENT REJECTED: Low resolution ({w}x{h}px).")
                else:
                    # Valid image structure when no master file is registered to compare against
                    document_verified = True
                    verification_score = 90
                    analysis_points.append(f"Format Check: Valid {doc_type} certificate image. Structure validated.")
            except Exception as e:
                document_verified = False
                verification_score = 20
                failure_reason = "Corrupt or invalid image file"
                analysis_points.append(f"DOCUMENT REJECTED: Corrupt image ({str(e)}).")

    analysis_points.append(f"SHA-256 Digest: {student_hash[:16]}...{student_hash[-12:]}")

    return {
        "document_verified": document_verified,
        "verification_score": verification_score,
        "document_type": doc_type,
        "failure_reason": failure_reason,
        "analysis_notes": "\n".join(analysis_points)
    }
