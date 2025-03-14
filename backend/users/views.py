from rest_framework import viewsets, permissions, status, generics
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from django.db import transaction
from .models import Tenant, TenantUser, Department
from .serializers import (
    UserSerializer, 
    UserRegistrationSerializer,
    UserCreateSerializer,
    TenantSerializer,
    TenantUserSerializer,
    DepartmentSerializer
)

User = get_user_model()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom token serializer to include user industry information
    """
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Get the user
        user = self.user
        
        # Get the tenant user information
        try:
            tenant_user = TenantUser.objects.get(user=user)
            # Add industry information to the response
            data['user'] = {
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role,
                'industry': tenant_user.industry,
                'industry_display': tenant_user.get_industry_display()
            }
        except TenantUser.DoesNotExist:
            data['user'] = {
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role
            }
        
        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom token view to use our serializer
    """
    serializer_class = CustomTokenObtainPairSerializer


class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for User model.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        Filter users by the authenticated user's tenant.
        Allow filtering by tenant_id and is_active parameters.
        """
        queryset = User.objects.all()
        
        # Filter by tenant_id from query params or user's tenant_id
        tenant_id = self.request.query_params.get('tenant')
        if tenant_id:
            queryset = queryset.filter(tenant_id=tenant_id)
        elif not self.request.user.is_superuser:
            queryset = queryset.filter(tenant_id=self.request.user.tenant_id)
        
        # Filter by is_active if provided
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            is_active_bool = is_active.lower() == 'true'
            queryset = queryset.filter(is_active=is_active_bool)
            
        return queryset
    
    def get_serializer_class(self):
        """
        Return appropriate serializer class based on action.
        """
        if self.action == 'register':
            return UserRegistrationSerializer
        if self.action == 'create':
            return UserCreateSerializer
        return self.serializer_class
    
    def get_permissions(self):
        """
        Return appropriate permissions based on action.
        """
        if self.action == 'register':
            return [permissions.AllowAny()]
        return super().get_permissions()
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def register(self, request):
        """
        Register a new user and create a tenant.
        """
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            try:
                with transaction.atomic():
                    user = serializer.save()
                    # Get the tenant associated with the user
                    tenant_user = TenantUser.objects.get(user=user, role='owner')
                    tenant = tenant_user.tenant
                    
                    # Return user and tenant data
                    return Response({
                        'user': UserSerializer(user).data,
                        'tenant': TenantSerializer(tenant).data,
                        'industry': tenant_user.industry,
                        'industry_display': tenant_user.get_industry_display(),
                        'message': 'User registered successfully'
                    }, status=status.HTTP_201_CREATED)
            except Exception as e:
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """
        Return the authenticated user.
        """
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def industry_choices(self, request):
        """
        Return the available industry choices.
        """
        return Response({
            'choices': [
                {'value': choice[0], 'display': choice[1]} 
                for choice in TenantUser.INDUSTRY_CHOICES
            ]
        })

    @action(detail=False, methods=['get'])
    def active_by_tenant(self, request):
        """
        Return active users for a specific tenant.
        """
        tenant_id = request.query_params.get('tenant')
        if not tenant_id:
            return Response(
                {"error": "Tenant ID is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        users = User.objects.filter(tenant_id=tenant_id, is_active=True)
        serializer = self.get_serializer(users, many=True)
        return Response(serializer.data)


class TenantViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Tenant model.
    """
    queryset = Tenant.objects.all()
    serializer_class = TenantSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        Filter tenants by the authenticated user's tenant.
        """
        user = self.request.user
        if user.is_superuser:
            return Tenant.objects.all()
        
        # Get all tenants the user is associated with
        tenant_users = TenantUser.objects.filter(user=user)
        tenant_ids = [tu.tenant_id for tu in tenant_users]
        return Tenant.objects.filter(id__in=tenant_ids)


class TenantUserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for TenantUser model.
    """
    queryset = TenantUser.objects.all()
    serializer_class = TenantUserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        Filter tenant users by the authenticated user's tenant.
        """
        user = self.request.user
        if user.is_superuser:
            return TenantUser.objects.all()
        
        # Get all tenant users for the user's tenant
        return TenantUser.objects.filter(tenant_id=user.tenant_id)


class DepartmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Department model.
    """
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        Filter departments by the authenticated user's tenant.
        """
        user = self.request.user
        if user.is_superuser:
            return Department.objects.all()
        return Department.objects.filter(tenant_id=user.tenant_id)
    
    def perform_create(self, serializer):
        """
        Set the tenant to the authenticated user's tenant.
        """
        tenant_id = self.request.user.tenant_id
        tenant = Tenant.objects.get(id=tenant_id)
        serializer.save(tenant=tenant)