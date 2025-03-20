from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TeamViewSet, TeamMemberViewSet, DepartmentHeadViewSet

router = DefaultRouter()
router.register(r'teams', TeamViewSet, basename='team')
router.register(r'team-members', TeamMemberViewSet, basename='team-member')
router.register(r'department-heads', DepartmentHeadViewSet, basename='department-head')

urlpatterns = [
    path('', include(router.urls)),
]
