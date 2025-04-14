from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TravelPackageViewSet,
    TravelHotelViewSet,
    TravelFlightViewSet,
    TravelTransferViewSet
)

router = DefaultRouter()
router.register(r'packages', TravelPackageViewSet)
router.register(r'hotels', TravelHotelViewSet)
router.register(r'flights', TravelFlightViewSet)
router.register(r'transfers', TravelTransferViewSet)

urlpatterns = [
    path('', include(router.urls)),
] 