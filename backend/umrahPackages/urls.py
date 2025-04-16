from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UmrahPackageViewSet, UmrahHotelViewSet

router = DefaultRouter()
router.register(r'umrah-packages', UmrahPackageViewSet, basename='umrah-package')
router.register(r'umrah-hotels', UmrahHotelViewSet, basename='umrah-hotel')

urlpatterns = [
    path('', include(router.urls)),
    
    # Convenience direct paths for common operations
    path('umrah-packages-active/', 
         UmrahPackageViewSet.as_view({'get': 'active'}), 
         name='umrah-packages-active'),
    
    path('umrah-packages-stats/', 
         UmrahPackageViewSet.as_view({'get': 'statistics'}), 
         name='umrah-packages-stats'),
    
    path('umrah-packages-vehicle-types/', 
         UmrahPackageViewSet.as_view({'get': 'vehicle_types'}), 
         name='umrah-vehicle-types'),
    
    path('umrah-hotels-by-city/', 
         UmrahHotelViewSet.as_view({'get': 'by_city'}), 
         name='umrah-hotels-by-city'),
] 