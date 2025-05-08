from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/leads/$', consumers.LeadConsumer.as_asgi()),
] 