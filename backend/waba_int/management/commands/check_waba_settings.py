from django.core.management.base import BaseCommand
from waba_int.models import WABASettings
from django.contrib.auth.hashers import check_password

class Command(BaseCommand):
    help = 'Check WABASettings records in the database'

    def add_arguments(self, parser):
        parser.add_argument('--tenant-id', type=str, help='Filter by tenant ID')

    def handle(self, *args, **options):
        tenant_id = options.get('tenant_id')
        
        if tenant_id:
            settings = WABASettings.objects.filter(tenant_id=tenant_id)
            self.stdout.write(f"Found {settings.count()} WABASettings records for tenant_id: {tenant_id}")
        else:
            settings = WABASettings.objects.all()
            self.stdout.write(f"Found {settings.count()} WABASettings records in total")
        
        for setting in settings:
            self.stdout.write(f"\nWABASettings ID: {setting.id}")
            self.stdout.write(f"Tenant ID: {setting.tenant_id}")
            self.stdout.write(f"API URL: {setting.api_url}")
            self.stdout.write(f"Email: {setting.email}")
            self.stdout.write(f"Password length: {len(setting.password) if setting.password else 0}")
            self.stdout.write(f"Is active: {setting.is_active}")
            
            # Check if the password is hashed
            if setting.password:
                is_hashed = setting.password.startswith('pbkdf2_sha256$') or setting.password.startswith('bcrypt$')
                self.stdout.write(f"Password is hashed: {is_hashed}")
                
                # If we have a tenant_id, try to authenticate with the stored credentials
                if tenant_id:
                    from waba_int.services.waba_int import OnCloudAPIClient
                    try:
                        client = OnCloudAPIClient(tenant_id=tenant_id)
                        self.stdout.write("Successfully initialized OnCloudAPIClient")
                        
                        # Try to get an access token
                        try:
                            token = client._get_access_token()
                            self.stdout.write(f"Successfully obtained access token: {token[:10]}...")
                        except Exception as e:
                            self.stdout.write(f"Failed to obtain access token: {str(e)}")
                    except Exception as e:
                        self.stdout.write(f"Failed to initialize OnCloudAPIClient: {str(e)}") 