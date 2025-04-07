from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FlightViewSet, PassengerDetailViewSet, CostDetailViewSet

router = DefaultRouter()
router.register(r'flights', FlightViewSet, basename='flight')
router.register(r'passengers', PassengerDetailViewSet, basename='passenger')
router.register(r'cost-details', CostDetailViewSet, basename='cost-detail')

urlpatterns = [
    path('', include(router.urls)),
] 