from django.core.management.base import BaseCommand
from accounts.signals import ensure_default_data

class Command(BaseCommand):
    help = "Seeds default admin, student, employer accounts and sample authorized records."

    def handle(self, *args, **options):
        ensure_default_data()
        self.stdout.write(self.style.SUCCESS("Successfully seeded default demo accounts and records."))
