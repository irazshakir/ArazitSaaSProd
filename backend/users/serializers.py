from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import Tenant, TenantUser, Department, Branch

User = get_user_model()


class BranchSerializer(serializers.ModelSerializer):
    """Serializer for the Branch model."""
    
    tenant_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Branch
        fields = ('id', 'name', 'description', 'tenant', 'tenant_name', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')
    
    def get_tenant_name(self, obj):
        if obj.tenant:
            return obj.tenant.name
        return None


class DepartmentSerializer(serializers.ModelSerializer):
    """Serializer for the Department model."""
    
    tenant_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Department
        fields = ('id', 'name', 'description', 'tenant', 'tenant_name', 'is_active', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')
    
    def get_tenant_name(self, obj):
        if obj.tenant:
            return obj.tenant.name
        return None


class UserSerializer(serializers.ModelSerializer):
    """Serializer for the User model."""
    
    branch_name = serializers.SerializerMethodField()
    department_details = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = (
            'id', 'email', 'first_name', 'last_name', 'phone_number', 
            'profile_picture', 'is_tenant_owner', 'role', 'branch', 
            'branch_name', 'department', 'department_details', 'tenant_id'
        )
        read_only_fields = ('id', 'is_tenant_owner')
    
    def get_branch_name(self, obj):
        if obj.branch:
            return obj.branch.name
        return None
        
    def get_department_details(self, obj):
        if obj.department:
            return {
                'id': obj.department.id,
                'name': obj.department.name
            }
        return None
        
    def update(self, instance, validated_data):
        """
        Custom update method to handle user updates including related fields.
        """
        # Update basic user fields
        for attr, value in validated_data.items():
            if attr not in ['branch', 'department']:  # Handle these separately
                setattr(instance, attr, value)
        
        # Handle branch relationship
        if 'branch' in validated_data:
            branch_id = validated_data.get('branch')
            if branch_id:
                try:
                    # If branch is provided as an ID, fetch the Branch instance
                    if isinstance(branch_id, str):
                        branch = Branch.objects.get(id=branch_id)
                        instance.branch = branch
                    else:
                        # If branch is already a Branch instance, use it directly
                        instance.branch = branch_id
                except Branch.DoesNotExist:
                    pass
            else:
                # If branch is explicitly set to None, remove the relationship
                instance.branch = None
        
        # Handle department relationship
        if 'department' in validated_data:
            department_id = validated_data.get('department')
            if department_id:
                try:
                    # If department is provided as an ID, fetch the Department instance
                    if isinstance(department_id, str):
                        department = Department.objects.get(id=department_id)
                        instance.department = department
                    else:
                        # If department is already a Department instance, use it directly
                        instance.department = department_id
                except Department.DoesNotExist:
                    pass
            else:
                # If department is explicitly set to None, remove the relationship
                instance.department = None
        
        # Save the updated user
        instance.save()
        
        return instance


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""
    
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    tenant_name = serializers.CharField(required=True, write_only=True)
    industry = serializers.ChoiceField(required=True, write_only=True, choices=TenantUser.INDUSTRY_CHOICES)
    
    class Meta:
        model = User
        fields = ('email', 'password', 'password2', 'first_name', 'last_name', 
                 'phone_number', 'tenant_name', 'industry', 'role')
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True},
            'role': {'required': False}
        }
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs
    
    def create(self, validated_data):
        # Remove tenant_name and password2 from validated_data
        tenant_name = validated_data.pop('tenant_name')
        industry = validated_data.pop('industry')
        validated_data.pop('password2')
        
        # Set default role to admin if not provided
        if 'role' not in validated_data:
            validated_data['role'] = User.ROLE_ADMIN
        
        # Create user
        user = User.objects.create(
            email=validated_data['email'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            phone_number=validated_data.get('phone_number', ''),
            role=validated_data['role'],
            is_tenant_owner=True
        )
        
        user.set_password(validated_data['password'])
        user.save()
        
        # Create tenant
        tenant = Tenant.objects.create(
            name=tenant_name,
            owner=user
        )
        
        # Associate user with tenant
        TenantUser.objects.create(
            user=user,
            tenant=tenant,
            role='owner',
            industry=industry
        )
        
        # Update user's tenant_id
        user.tenant_id = tenant.id
        user.save()
        
        return user


class TenantSerializer(serializers.ModelSerializer):
    """Serializer for the Tenant model."""
    
    class Meta:
        model = Tenant
        fields = ('id', 'name', 'domain', 'created_at', 'updated_at', 'is_active', 'subscription_plan')
        read_only_fields = ('id', 'created_at', 'updated_at')


class TenantUserSerializer(serializers.ModelSerializer):
    """Serializer for the TenantUser model."""
    
    user = UserSerializer(read_only=True)
    tenant = TenantSerializer(read_only=True)
    industry_display = serializers.SerializerMethodField()
    
    class Meta:
        model = TenantUser
        fields = ('id', 'user', 'tenant', 'role', 'industry', 'industry_display', 'created_at')
        read_only_fields = ('id', 'created_at')
    
    def get_industry_display(self, obj):
        return obj.get_industry_display()


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating users within a tenant."""
    
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    branch_id = serializers.UUIDField(required=False, write_only=True)
    department_id = serializers.UUIDField(required=False, write_only=True)
    industry = serializers.ChoiceField(required=False, write_only=True, choices=TenantUser.INDUSTRY_CHOICES)
    profile_picture = serializers.ImageField(required=False)
    
    class Meta:
        model = User
        fields = (
            'email', 'password', 'first_name', 'last_name', 'phone_number', 
            'role', 'branch_id', 'department_id', 'industry', 'is_active', 
            'profile_picture', 'tenant_id'
        )
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True},
            'role': {'required': True},
            'tenant_id': {'required': False}
        }
    
    def create(self, validated_data):
        """
        Create a new user with tenant association.
        Also creates a TenantUser record for the user.
        """
        # Extract tenant_id
        tenant_id = validated_data.pop('tenant_id', None)
        request = self.context.get('request')
        
        if not tenant_id and request and hasattr(request, 'user'):
            tenant_id = request.user.tenant_id
        
        try:
            tenant = Tenant.objects.get(id=tenant_id)
        except Tenant.DoesNotExist:
            error_msg = f"Invalid tenant ID or tenant not found: {tenant_id}"
            raise serializers.ValidationError({"tenant_id": error_msg})
        
        # Handle branch
        branch = None
        if 'branch_id' in validated_data:
            branch_id = validated_data.pop('branch_id')
            if branch_id:
                try:
                    branch = Branch.objects.get(id=branch_id)
                except Branch.DoesNotExist:
                    error_msg = f"Branch not found: {branch_id}"
                    raise serializers.ValidationError({"branch_id": error_msg})
        
        # Handle department
        department = None
        if 'department_id' in validated_data:
            department_id = validated_data.pop('department_id')
            if department_id:
                try:
                    department = Department.objects.get(id=department_id)
                except Department.DoesNotExist:
                    error_msg = f"Department not found: {department_id}"
                    raise serializers.ValidationError({"department_id": error_msg})
        
        # Get industry (required for TenantUser)
        industry = validated_data.pop('industry', None)
        if not industry:
            # Default to 'travel_tourism' if not provided
            industry = 'travel_tourism'
        
        try:
            # Create user with department and branch
            user_data = {
                'email': validated_data['email'],
                'first_name': validated_data['first_name'],
                'last_name': validated_data['last_name'],
                'phone_number': validated_data.get('phone_number', ''),
                'role': validated_data['role'],
                'branch': branch,
                'department': department,
                'tenant_id': tenant_id,
                'is_active': validated_data.get('is_active', True),
            }
            
            # Add profile picture if provided
            if 'profile_picture' in validated_data:
                user_data['profile_picture'] = validated_data['profile_picture']
            
            # Create the user object
            user = User.objects.create(**user_data)
            
            # Set password
            user.set_password(validated_data['password'])
            user.save()
            
            # Create TenantUser association
            tenant_user = TenantUser.objects.create(
                user=user,
                tenant=tenant,
                role=validated_data['role'],
                industry=industry
            )
            
            return user
        except Exception as e:
            raise serializers.ValidationError({"error": str(e)})