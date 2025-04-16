from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TeamViewSet, TeamManagerViewSet, TeamLeadViewSet, TeamMemberViewSet

router = DefaultRouter()
router.register(r'teams', TeamViewSet, basename='team')
router.register(r'team-managers', TeamManagerViewSet, basename='team-manager')
router.register(r'team-leads', TeamLeadViewSet, basename='team-lead')
router.register(r'team-members', TeamMemberViewSet, basename='team-member')

urlpatterns = [
    path('', include(router.urls)),
]