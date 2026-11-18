from django.urls import path
from .views import (
    CertificateListCreateView,
    AuthorizedCertificateListCreateView,
    AuthorizedCertificateDetailView,
    PublicVerificationView,
    ReportSummaryView,
)

urlpatterns = [
    path("certificates/", CertificateListCreateView.as_view(), name="certificates"),
    path("institutions/authorized-certificates/", AuthorizedCertificateListCreateView.as_view(), name="authorized-certificates"),
    path("institutions/authorized-certificates/<int:pk>/", AuthorizedCertificateDetailView.as_view(), name="authorized-certificate-detail"),
    path("verification/<str:reference>/", PublicVerificationView.as_view(), name="public-verification"),
    path("reports/summary/", ReportSummaryView.as_view(), name="report-summary"),
]
