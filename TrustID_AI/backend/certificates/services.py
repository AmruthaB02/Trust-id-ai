import hashlib
from pathlib import Path
from django.core.files.base import ContentFile
from django.conf import settings
import qrcode

def sha256_file(uploaded_file):
    digest = hashlib.sha256()
    for chunk in uploaded_file.chunks():
        digest.update(chunk)
    uploaded_file.seek(0)
    return digest.hexdigest()

def create_qr_image(reference):
    frontend_base = getattr(settings, "FRONTEND_BASE_URL", "http://localhost:5173")
    url = f"{frontend_base}/verify/{reference}"
    image = qrcode.make(url)
    from io import BytesIO
    buffer = BytesIO()
    image.save(buffer, format="PNG")
    return ContentFile(buffer.getvalue(), name=f"verification-{reference}.png")
