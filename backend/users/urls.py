from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenRefreshView,
    TokenVerifyView,
)
from .views import (
    UserViewSet, 
    TenantViewSet, 
    TenantUserViewSet, 
    DepartmentViewSet,
    CustomTokenObtainPairView
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'tenants', TenantViewSet)
router.register(r'tenant-users', TenantUserViewSet)
router.register(r'departments', DepartmentViewSet)

urlpatterns = [
    # JWT Authentication - Using our custom token view
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    
    # User Registration
    path('register/', UserViewSet.as_view({'post': 'register'}), name='register'),
    
    # Current User
    path('me/', UserViewSet.as_view({'get': 'me'}), name='me'),
    
    # Industry Choices
    path('industry-choices/', UserViewSet.as_view({'get': 'industry_choices'}), name='industry_choices'),
    
    # Router URLs
    path('', include(router.urls)),
] 