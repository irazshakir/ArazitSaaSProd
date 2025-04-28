import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
import leads.routing
import waba_int.routing  # New routing for WhatsApp

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(
            leads.routing.websocket_urlpatterns +
            waba_int.routing.websocket_urlpatterns  # Add WhatsApp routes
        )
    ),
})