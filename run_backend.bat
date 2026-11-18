@echo off
cd /d "%~dp0backend"
if not exist ".venv" (
    echo Creating Python virtual environment...
    python -m venv .venv
    call .venv\Scripts\activate.bat
    python -m pip install --upgrade pip
    pip install -r requirements.txt
) else (
    call .venv\Scripts\activate.bat
)
echo Applying migrations and ensuring default accounts...
python manage.py migrate --noinput
python manage.py seed_demo_data
echo Starting Django Backend at http://127.0.0.1:8000/ ...
python manage.py runserver 127.0.0.1:8000
