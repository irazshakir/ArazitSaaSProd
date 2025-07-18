from django.core.management.base import BaseCommand
from waba_int.models import WABASettings

class Command(BaseCommand):
    help = 'Update WABASettings password'

    def add_arguments(self, parser):
        parser.add_argument('--tenant-id', type=str, required=True, help='Tenant ID')
        parser.add_argument('--password', type=str, required=True, help='New password')

    def handle(self, *args, **options):
        tenant_id = options.get('tenant_id')
        password = options.get('password')
        
        try:
            settings = WABASettings.objects.get(tenant_id=tenant_id)
            settings.password = password
            settings.save()
            self.stdout.write(self.style.SUCCESS(f"Successfully updated password for tenant_id: {tenant_id}"))
        except WABASettings.DoesNotExist:
            self.stdout.write(self.style.ERROR(f"No WABASettings found for tenant_id: {tenant_id}"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error updating password: {str(e)}")) 