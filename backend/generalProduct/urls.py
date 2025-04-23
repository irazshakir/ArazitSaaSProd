from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import GeneralProductViewSet

router = DefaultRouter()
router.register(r'products', GeneralProductViewSet, basename='general-product')

urlpatterns = [
    path('', include(router.urls)),
] 