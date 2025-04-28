from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from .models import LeadActivity, Notification
import logging
import redis
from django.conf import settings
from celery.exceptions import Retry
from celery.utils.log import get_task_logger
from backend.celery import app

logger = get_task_logger(__name__)

def test_redis_connection():
    """Test Redis connection and return error details if connection fails."""
    try:
        redis_url = app.conf.broker_url
        if redis_url.startswith('redis://'):
            redis_client = redis.from_url(redis_url)
        else:
            redis_client = redis.Redis(
                host=settings.REDIS_HOST,
                port=settings.REDIS_PORT,
                db=settings.REDIS_DB,
                socket_connect_timeout=5
            )
        redis_client.ping()
        return True, None
    except redis.ConnectionError as e:
        return False, str(e)
    except Exception as e:
        return False, str(e)

@shared_task(bind=True, max_retries=3)
def create_activity_notification(self, activity_id):
    """Create a notification for a lead activity."""
    try:
        redis_ok, error = test_redis_connection()
        if not redis_ok:
            logger.error(f"Redis connection test failed: {error}")
            raise redis.ConnectionError(error)

        activity = LeadActivity.objects.get(id=activity_id)
        
        notification = Notification.objects.create(
            tenant=activity.tenant,
            user=activity.user,
            notification_type=Notification.TYPE_ACTIVITY_REMINDER,
            title=f"Activity Due: {activity.activity_type}",
            message=f"Activity due now: {activity.description}",
            lead=activity.lead,
            lead_activity=activity
        )
        
    except LeadActivity.DoesNotExist:
        logger.error(f"Activity {activity_id} not found")
    except redis.ConnectionError as exc:
        logger.error(f"Redis connection error: {exc}")
        raise self.retry(exc=exc, countdown=5)
    except Exception as e:
        logger.error(f"Error creating notification for activity {activity_id}: {str(e)}")
        raise

@shared_task(bind=True, max_retries=3)
def create_activity_reminder_notification(self, activity_id):
    """Create a reminder notification one hour before the activity is due."""
    try:
        redis_ok, error = test_redis_connection()
        if not redis_ok:
            logger.error(f"Redis connection test failed: {error}")
            raise redis.ConnectionError(error)

        activity = LeadActivity.objects.get(id=activity_id)
        
        notification = Notification.objects.create(
            tenant=activity.tenant,
            user=activity.user,
            notification_type=Notification.TYPE_ACTIVITY_REMINDER,
            title=f"Activity Reminder: {activity.activity_type}",
            message=f"Activity due in 1 hour: {activity.description}",
            lead=activity.lead,
            lead_activity=activity
        )
        
    except LeadActivity.DoesNotExist:
        logger.error(f"Activity {activity_id} not found")
    except redis.ConnectionError as exc:
        logger.error(f"Redis connection error: {exc}")
        raise self.retry(exc=exc, countdown=5)
    except Exception as e:
        logger.error(f"Error creating reminder notification for activity {activity_id}: {str(e)}")
        raise

def schedule_activity_notifications(activity):
    """Schedule notifications for a lead activity."""
    try:
        if not activity.due_date or not activity.user:
            logger.warning(f"Activity {activity.id} has no due_date or user, skipping notifications")
            return

        redis_ok, error = test_redis_connection()
        if not redis_ok:
            logger.error(f"Redis connection test failed: {error}")
            raise redis.ConnectionError(error)
            
        create_activity_notification.apply_async(
            args=[activity.id],
            eta=activity.due_date,
            retry=True,
            retry_policy={
                'max_retries': 3,
                'interval_start': 0,
                'interval_step': 0.2,
                'interval_max': 0.2,
            }
        )
        
        reminder_time = activity.due_date - timedelta(hours=1)
        if reminder_time > timezone.now():
            create_activity_reminder_notification.apply_async(
                args=[activity.id],
                eta=reminder_time,
                retry=True,
                retry_policy={
                    'max_retries': 3,
                    'interval_start': 0,
                    'interval_step': 0.2,
                    'interval_max': 0.2,
                }
            )
            
    except redis.ConnectionError as e:
        logger.error(f"Redis connection error in schedule_activity_notifications: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Error scheduling notifications for activity {activity.id}: {str(e)}")
        raise 