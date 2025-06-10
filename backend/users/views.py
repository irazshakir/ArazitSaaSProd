from rest_framework import viewsets, permissions, status, generics, serializers
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from django.db import transaction, connection
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
from django.utils import timezone

User = get_user_model()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom token serializer to include user industry information
    """
    def validate(self, attrs):
        print("Starting token validation")
        print("Received attrs:", {k: '***' if k == 'password' else v for k, v in attrs.items()})
        try:
            data = super().validate(attrs)
            print("Parent validation successful")
            
            # Get the user
            user = self.user
            print(f"Got user: {user.email}")
            
            # Basic user data without tenant-specific info
            user_data = {
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role,
                'department_id': str(user.department.id) if user.department and hasattr(user.department, 'id') else None,
                'department_name': user.department.name if user.department and hasattr(user.department, 'name') else None
            }
            
            # Get the tenant user information - prefer the first one if multiple exist
            try:
                # Get the first tenant_user record for this user
                tenant_user = TenantUser.objects.filter(user=user).first()
                
                if tenant_user:
                    # Add industry information if tenant_user exists
                    user_data.update({
                        'industry': tenant_user.industry,
                        'industry_display': tenant_user.get_industry_display() if tenant_user.industry else None,
                        'tenant_id': str(tenant_user.tenant.id) if tenant_user.tenant else None,
                        'tenant_name': tenant_user.tenant.name if tenant_user.tenant else None
                    })
            except Exception as e:
                # Log the error but continue without tenant-specific data
                print(f"Error retrieving tenant info: {str(e)}")
            
            # Add the user data to the response
            data['user'] = user_data
            
            return data
        except Exception as e:
            print(f"Error in validate: {str(e)}")
            raise e


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
    
    def update(self, request, *args, **kwargs):
        """
        Custom update method to handle user updates.
        """
        print(f"Update request received for user {kwargs.get('pk')}")
        print(f"Request data: {request.data}")
        
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        print(f"Processing update for user: {instance.email}")
        
        # Get data to update
        data = request.data.copy() if hasattr(request.data, 'copy') else request.data
        
        # Preprocessing for department and branch
        # If department is provided as an ID, use it directly
        if 'department' in data and data['department']:
            try:
                # We're letting the serializer handle the relationship
                print(f"Department ID provided: {data['department']}")
            except Exception as e:
                print(f"Error processing department: {str(e)}")
        
        # If branch is provided as an ID, use it directly
        if 'branch' in data and data['branch']:
            try:
                # We're letting the serializer handle the relationship
                print(f"Branch ID provided: {data['branch']}")
            except Exception as e:
                print(f"Error processing branch: {str(e)}")
        
        # Ensure tenant_id is set
        if 'tenant_id' in data:
            try:
                print(f"Tenant ID provided: {data['tenant_id']}")
            except:
                # If there's an error, continue without changing tenant
                pass
        
        # Initialize serializer with the instance and data
        serializer = self.get_serializer(instance, data=data, partial=partial)
        
        # Validate data
        try:
            serializer.is_valid(raise_exception=True)
            print(f"Validated data: {serializer.validated_data}")
        except Exception as e:
            print(f"Validation error: {str(e)}")
            raise
        
        # Perform update
        try:
            self.perform_update(serializer)
            print(f"User {instance.email} updated successfully")
        except Exception as e:
            print(f"Error during perform_update: {str(e)}")
            raise
        
        if getattr(instance, '_prefetched_objects_cache', None):
            # If 'prefetch_related' has been applied to a queryset, we need to
            # forcibly invalidate the prefetch cache on the instance.
            instance._prefetched_objects_cache = {}
        
        return Response(serializer.data)
    
    def partial_update(self, request, *args, **kwargs):
        """
        Custom partial update method with explicit PATCH handling.
        """
        print(f"Partial update request received for user {kwargs.get('pk')}")
        print(f"Request data: {request.data}")
        
        # Set partial=True for PATCH requests
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)
    
    @action(detail=True, methods=['post'])
    def direct_update(self, request, pk=None):
        """
        Direct database update as a fallback when regular updates fail
        """
        user = self.get_object()
        
        # Get data for update
        data = request.data.copy() if hasattr(request.data, 'copy') else request.data
        
        # Collect update fields
        update_fields = []
        field_values = []
        
        # Basic fields
        field_map = {
            'first_name': 'first_name',
            'last_name': 'last_name',
            'email': 'email',
            'phone_number': 'phone_number',
            'role': 'role',
            'is_active': 'is_active',
        }
        
        # Add updates for basic fields
        for client_field, db_field in field_map.items():
            if client_field in data:
                value = data[client_field]
                
                # Handle boolean for is_active
                if client_field == 'is_active':
                    if isinstance(value, str):
                        value = value.lower() == 'true'
                    else:
                        value = bool(value)
                
                update_fields.append(f"{db_field} = %s")
                field_values.append(value)
        
        # Handle department if provided
        if 'department' in data and data['department']:
            try:
                department = Department.objects.get(id=data['department'])
                update_fields.append("department_id = %s")
                field_values.append(str(department.id))
            except Department.DoesNotExist:
                return Response({
                    'error': f"Department with ID {data['department']} not found"
                }, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                return Response({
                    'error': f"Error processing department: {str(e)}"
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Handle branch if provided
        if 'branch' in data and data['branch']:
            try:
                branch = Branch.objects.get(id=data['branch'])
                update_fields.append("branch_id = %s")
                field_values.append(str(branch.id))
            except Branch.DoesNotExist:
                return Response({
                    'error': f"Branch with ID {data['branch']} not found"
                }, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                return Response({
                    'error': f"Error processing branch: {str(e)}"
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Ensure we have fields to update
        if not update_fields:
            return Response({
                'error': 'No valid fields to update'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Build SQL query - Note that Django's User model might not have updated_at field
        # Use the correct table name which could be auth_user or users_user
        try:
            # Get the table name from the model's _meta
            table_name = User._meta.db_table
            
            # Check if the updated_at field exists
            has_updated_at = any(field.name == 'updated_at' for field in User._meta.fields)
            
            # Build the SQL query with or without updated_at field
            if has_updated_at:
                sql = f"UPDATE {table_name} SET {', '.join(update_fields)}, updated_at = NOW() WHERE id = %s"
            else:
                sql = f"UPDATE {table_name} SET {', '.join(update_fields)} WHERE id = %s"
        except Exception as e:
            return Response({
                'error': f"Error building query: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Add user ID to parameters
        field_values.append(str(user.id))
        
        try:
            # Execute raw SQL query
            with connection.cursor() as cursor:
                cursor.execute(sql, field_values)
                
                # Check affected rows
                rows_updated = cursor.rowcount
            
            # Refresh the user object
            user.refresh_from_db()
            serializer = self.get_serializer(user)
            
            return Response({
                'success': True,
                'message': f"User updated successfully.",
                'user': serializer.data
            })
        except Exception as e:
            return Response({
                'error': f"Error executing direct update: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
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
        
        # Get user IDs that are associated with this tenant through TenantUser
        tenant_user_ids = TenantUser.objects.filter(
            tenant_id=tenant_id
        ).values_list('user_id', flat=True)
        
        # Filter users by these IDs and active status
        users = User.objects.filter(
            id__in=tenant_user_ids, 
            is_active=True
        )
        
        serializer = self.get_serializer(users, many=True)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        """Create a new user for the current tenant."""
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
            except Department.DoesNotExist:
                raise serializers.ValidationError({"department": "Department not found."})
        
        # Check serializer initialization and validation
        serializer = self.get_serializer(data=data)
        is_valid = serializer.is_valid(raise_exception=False)
        
        if not is_valid:
            if 'profile_picture' in serializer.errors:
                serializer.is_valid(raise_exception=True)  # Raise exception now
        else:
            self.perform_create(serializer)
        
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

    @action(detail=False, methods=['get'])
    def user_tenants(self, request):
        """
        Get all tenants associated with the current user, including industry information.
        """
        user = request.user
        tenant_users = TenantUser.objects.filter(user=user).select_related('tenant')
        serializer = self.get_serializer(tenant_users, many=True)
        return Response(serializer.data)


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
        Filter branches by tenant.
        """
        queryset = Branch.objects.all()
        
        # Get tenant from query params
        tenant = self.request.query_params.get('tenant', None)
        
        if tenant:
            queryset = queryset.filter(tenant_id=tenant)
        
        return queryset
    
    def perform_create(self, serializer):
        """
        Create a new branch for the current tenant.
        """
        tenant_id = self.request.data.get('tenant')
        if not tenant_id:
            raise serializers.ValidationError({"tenant": "Tenant ID is required"})
            
        try:
            tenant = Tenant.objects.get(id=tenant_id)
            serializer.save(tenant=tenant)
        except Tenant.DoesNotExist:
            raise serializers.ValidationError({"tenant": "Invalid tenant ID"})