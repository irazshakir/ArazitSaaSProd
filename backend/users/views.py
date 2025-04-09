from rest_framework import viewsets, permissions, status, generics
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from django.db import transaction
from .models import Tenant, TenantUser, Department, Branch
from .serializers import (
    UserSerializer, 
    UserRegistrationSerializer,
    UserCreateSerializer,
    TenantSerializer,
    TenantUserSerializer,
    DepartmentSerializer,
    BranchSerializer
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
                'industry_display': tenant_user.get_industry_display(),
                'department_id': str(user.department.id) if user.department else None,
                'department_name': user.department.name if user.department else None
            }
        except TenantUser.DoesNotExist:
            data['user'] = {
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role,
                'department_id': str(user.department.id) if user.department else None,
                'department_name': user.department.name if user.department else None
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
        Filter users by request parameters.
        Allow filtering by tenant_id and is_active parameters.
        """
        queryset = User.objects.all()
        
        # Filter by tenant_id from query params if provided
        tenant_id = self.request.query_params.get('tenant')
        if tenant_id:
            queryset = queryset.filter(tenant_id=tenant_id)
        
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

    def create(self, request, *args, **kwargs):
        """Create a new user for the current tenant."""
        print("\n===== DETAILED FILE UPLOAD DEBUG =====")
        print("REQUEST CONTENT TYPE:", request.content_type)
        print("REQUEST FILES:", request.FILES.keys())
        
        if 'profile_picture' in request.FILES:
            file = request.FILES['profile_picture']
            print("PROFILE PICTURE FOUND!!")
            print(f"- File name: {file.name}")
            print(f"- File size: {file.size} bytes")
            print(f"- File content type: {file.content_type}")
        else:
            print("NO PROFILE PICTURE IN request.FILES!")
            
            # Check alternative keys that might be used
            for key in request.FILES.keys():
                print(f"- Found file with key: {key}")
                file = request.FILES[key]
                print(f"  • File name: {file.name}")
                print(f"  • File size: {file.size} bytes")
        
        print("DATA KEYS:", request.data.keys())
        print("=========================")
        
        # Collect serializer class information for debugging
        serializer_class = self.get_serializer_class()
        print("SERIALIZER CLASS:", serializer_class.__name__)
        print("SERIALIZER FIELDS:", serializer_class.Meta.fields if hasattr(serializer_class, 'Meta') else "Unknown")
        
        # Get tenant_id from request data or from the authenticated user
        tenant_id = request.data.get('tenant_id', request.user.tenant_id)
        
        # Create a mutable copy of request.data to add the tenant_id and handle department
        data = request.data.copy() if hasattr(request.data, 'copy') else request.data
        data['tenant_id'] = tenant_id
        
        # Handle department assignment
        department_id = data.get('department')
        if department_id:
            try:
                department = Department.objects.get(
                    id=department_id
                )
                data['department_id'] = department.id
                print(f"Department found and assigned: {department.name} (ID: {department.id})")
            except Department.DoesNotExist:
                print(f"Department with ID {department_id} not found")
                raise serializers.ValidationError({"department": "Department not found."})
        
        print("MODIFIED DATA FOR SERIALIZER:")
        for key, value in data.items():
            if key == 'profile_picture' and hasattr(value, 'name'):
                print(f"- {key}: <File: {value.name}, {value.size} bytes>")
            else:
                print(f"- {key}: {value}")
        
        # Check serializer initialization and validation
        print("INITIALIZING SERIALIZER...")
        serializer = self.get_serializer(data=data)
        print("VALIDATING SERIALIZER...")
        is_valid = serializer.is_valid(raise_exception=False)
        
        if not is_valid:
            print("SERIALIZER VALIDATION ERRORS:", serializer.errors)
            if 'profile_picture' in serializer.errors:
                print("PROFILE PICTURE ERRORS:", serializer.errors['profile_picture'])
            serializer.is_valid(raise_exception=True)  # Raise exception now
        else:
            print("SERIALIZER IS VALID")
        
        print("PERFORMING CREATE...")
        self.perform_create(serializer)
        print("CREATE PERFORMED SUCCESSFULLY")
        
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


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
    
    def perform_create(self, serializer):
        """
        Create a new department.
        """
        # Always use the first tenant for all departments
        try:
            # Get the first tenant in the system
            tenant = Tenant.objects.first()
            if not tenant:
                # If no tenant exists, use the authenticated user's tenant
                tenant_id = self.request.user.tenant_id
                tenant = Tenant.objects.get(id=tenant_id)
        except Tenant.DoesNotExist:
            raise serializers.ValidationError({"tenant": "No tenant found in the system."})
        
        serializer.save(tenant=tenant)


class BranchViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Branch model.
    """
    queryset = Branch.objects.all()
    serializer_class = BranchSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        Filter branches by the authenticated user's tenant.
        """
        # Return all branches regardless of tenant
        return Branch.objects.all()
    
    def perform_create(self, serializer):
        """
        Create a new branch for the current tenant.
        """
        # Always use the first tenant for all branches
        try:
            # Get the first tenant in the system
            tenant = Tenant.objects.first()
            if not tenant:
                # If no tenant exists, use the authenticated user's tenant
                tenant_id = self.request.user.tenant_id
                tenant = Tenant.objects.get(id=tenant_id)
        except Tenant.DoesNotExist:
            raise serializers.ValidationError({"tenant": "No tenant found in the system."})
        
        serializer.save(tenant=tenant)