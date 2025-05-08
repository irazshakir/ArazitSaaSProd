from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DevelopmentProjectViewSet

app_name = 'development_projects'

router = DefaultRouter()
router.register(r'projects', DevelopmentProjectViewSet, basename='development-project')

urlpatterns = [
    path('', include(router.urls)),
] 