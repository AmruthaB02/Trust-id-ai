# TrustID AI — Local Demonstration Project

TrustID AI is a college-demonstration application for educational certificate submission and verification.

## Included in this ZIP

- React + Vite frontend with login, registration and role-based dashboards.
- Django REST Framework backend with SQLite.
- Student certificate upload and submission history.
- University administrator authorized-record registration and review list.
- Employer certificate verification using a public verification URL / QR reference.
- Report summary endpoint.
- SHA-256 document hashing and QR-code generation for records that match an authorized record.

## Important implementation boundary

This package provides a working **local demonstration workflow**. It does not claim to contain a trained CNN, a production OCR engine, a deployed smart contract, or a live blockchain connection. The backend currently compares the metadata entered with an authorized university record and calculates a SHA-256 file hash. A matching record is marked `verified_demo`; its QR URL resolves to the verification page. The blockchain transaction field is intentionally empty until a real chain integration is configured.

For a real deployment, add and validate OCR extraction, CNN/anomaly screening, issuer integrations, smart-contract deployment, transaction confirmation, security review, and production storage. Do not use this demo to make high-stakes credential decisions.

## Requirements

- Windows 10/11
- Python 3.10 or newer
- Node.js 18 or newer and npm
- VS Code (recommended)

## 1. Extract and open the project

1. Extract `TrustID_AI.zip`.
2. Open the extracted `TrustID_AI` folder in VS Code.
3. Open two VS Code terminals: one for Django and one for React.

## 2. Start the Django backend

In Terminal 1:

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
python manage.py makemigrations accounts certificates
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

If PowerShell blocks virtual-environment activation, run this once in that terminal:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

Backend URLs:

- API root: `http://127.0.0.1:8000/api/`
- Django admin: `http://127.0.0.1:8000/admin/`

The superuser can access Django admin. To use the University Administrator interface, create an account through the registration page only if you temporarily enable that role in the registration serializer, or set the role for a trusted account through Django admin. Public self-registration is restricted to `student` and `employer`.

## 3. Start the React frontend

In Terminal 2, from the project root:

```powershell
cd frontend
npm install
npm run dev
```

Open the URL printed by Vite, normally:

`http://localhost:5173`

## 4. Create demo accounts

Use the Register page to create:
- Student account
- Employer account

For a university administrator:
1. Sign in to Django admin at `http://127.0.0.1:8000/admin/`.
2. Open Users.
3. Edit a trusted account and set its role to `university_admin`.
4. Save and sign in again through the frontend.

## 5. Try the main flow

1. Sign in as a university administrator.
2. Open **Authorized records** and register a student record. Use a sample name, registration number, degree, university and graduation year.
3. Sign out and register/sign in as a student.
4. Upload a PDF/JPG/PNG certificate and enter metadata matching the authorized record.
5. The demo backend compares the entered metadata with the issuer record. A match receives `verified_demo`, a SHA-256 hash and a QR verification URL. A mismatch is marked `unverified`.
6. Sign in as an employer, paste the verification reference or URL, and view the public verification result.
7. View reports from the dashboard navigation.

For the demo comparison to match, the registration number, degree, university and graduation year must match an authorized record. Student name is also checked case-insensitively when it is provided in the upload form.

## 6. API endpoints

All endpoints are under `/api/`.

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `auth/register/` | Register student/employer |
| POST | `auth/token/` | Obtain JWT access and refresh tokens |
| GET | `auth/profile/` | Current account profile |
| GET, POST | `certificates/` | List own submissions / upload certificate |
| GET, POST | `institutions/authorized-certificates/` | List / register issuer records |
| GET | `verification/<uuid>/` | Public verification lookup |
| GET | `reports/summary/` | Role-scoped report summary |

## 7. Troubleshooting

- **`py` is not recognized:** install Python from python.org and enable the Python PATH option, or use `python` instead of `py`.
- **Activation script is blocked:** use the `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` command above.
- **Port 8000 is busy:** run `python manage.py runserver 8001` and update `frontend/.env`.
- **Frontend cannot reach backend:** make sure Django is running on port 8000 and check `frontend/.env`.
- **CORS error:** the local backend settings allow `localhost:5173` and `127.0.0.1:5173`.
- **No tables:** run `python manage.py makemigrations accounts certificates` followed by `python manage.py migrate`.

## Security and production notes

This is a local teaching/demo project. Before deployment, use environment variables and a production secret key, HTTPS, secure token storage, strict file validation and malware scanning, authorization tests, audit logging, private object storage, rate limiting, privacy/legal review, and a real issuer verification process. Avoid storing sensitive personal data or full certificate documents on a public blockchain.
