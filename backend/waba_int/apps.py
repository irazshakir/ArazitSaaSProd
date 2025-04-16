from django.apps import AppConfig


class WabaIntConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'waba_int'
    
    def ready(self):
        try:
            import waba_int.signals  # noqa
        except ImportError:
            pass
