from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CannedMessageViewSet

app_name = 'canned_messages'

# Create a router for the CannedMessageViewSet
router = DefaultRouter()
router.register(r'canned-messages', CannedMessageViewSet, basename='canned-messages')

urlpatterns = [
    # Include the router URLs
    path('', include(router.urls)),
] 