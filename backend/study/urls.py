from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StudyViewSet

router = DefaultRouter()
router.register(r'study', StudyViewSet, basename='study')

urlpatterns = [
    path('', include(router.urls)),
    # Add custom action URLs explicitly
    path('study/for-lead/', StudyViewSet.as_view({'get': 'for_lead'}), name='study-for-lead'),
    path('study/create-for-lead/', StudyViewSet.as_view({'post': 'create_for_lead'}), name='study-create-for-lead'),
] 