import os
from celery import Celery
from celery.signals import celeryd_after_setup

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

app = Celery('backend')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django app configs.
app.autodiscover_tasks()

# Configure Celery to handle connection retries and use Redis
app.conf.update(
    broker_url=f'redis://127.0.0.1:6379/0',
    result_backend=f'redis://127.0.0.1:6379/0',
    broker_connection_retry=True,
    broker_connection_retry_on_startup=True,
    broker_connection_max_retries=None,  # Retry forever
    task_track_started=True,
    task_time_limit=30 * 60  # 30 minutes
)

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')

@celeryd_after_setup.connect
def setup_direct_queue(sender, instance, **kwargs):
    """Ensure the worker is properly connected after setup."""
    print(f'Worker {sender} is ready and connected to the message broker.') 