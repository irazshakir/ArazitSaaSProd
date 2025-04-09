from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StudyInquiryViewSet, StudyEligibilityViewSet, StudyCostViewSet

router = DefaultRouter()
router.register(r'inquiries', StudyInquiryViewSet)
router.register(r'eligibility', StudyEligibilityViewSet)
router.register(r'costs', StudyCostViewSet)
router.register(r'study-visas', StudyInquiryViewSet)

app_name = 'study'

urlpatterns = [
    path('', include(router.urls)),
] 