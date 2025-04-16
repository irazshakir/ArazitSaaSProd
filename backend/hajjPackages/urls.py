from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import HajjPackageViewSet

router = DefaultRouter()
router.register(r'hajj-packages', HajjPackageViewSet)

urlpatterns = [
    path('', include(router.urls)),
] 