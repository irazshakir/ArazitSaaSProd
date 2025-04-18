from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LocationRoutingViewSet

router = DefaultRouter()
router.register(r'location-routing', LocationRoutingViewSet, basename='location-routing')

urlpatterns = [
    path('', include(router.urls)),
] 