from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import Tenant, TenantUser, Department

User = get_user_model()


class DepartmentSerializer(serializers.ModelSerializer):
    """Serializer for the Department model."""
    
    class Meta:
        model = Department
        fields = ('id', 'name', 'description', 'tenant', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')


class UserSerializer(serializers.ModelSerializer):
    """Serializer for the User model."""
    
    department_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'phone_number', 
                 'profile_picture', 'is_tenant_owner', 'role', 'department', 'department_name','tenant_id')
        read_only_fields = ('id', 'is_tenant_owner')
    
    def get_department_name(self, obj):
        if obj.department:
            return obj.department.name
        return None


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
    department_id = serializers.UUIDField(required=False, write_only=True)
    industry = serializers.ChoiceField(required=False, write_only=True, choices=TenantUser.INDUSTRY_CHOICES)
    
    class Meta:
        model = User
        fields = ('email', 'password', 'first_name', 'last_name', 'phone_number', 
                 'role', 'department_id', 'industry')
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True},
            'role': {'required': True}
        }
    
    def create(self, validated_data):
        # Get the tenant from the request
        request = self.context.get('request')
        tenant_id = request.user.tenant_id
        tenant = Tenant.objects.get(id=tenant_id)
        
        # Handle department if provided
        department = None
        if 'department_id' in validated_data:
            department_id = validated_data.pop('department_id')
            if department_id:
                try:
                    department = Department.objects.get(id=department_id, tenant=tenant)
                except Department.DoesNotExist:
                    raise serializers.ValidationError({"department_id": "Department not found."})
        
        # Extract industry if provided
        industry = validated_data.pop('industry', None)
        
        # Create user
        user = User.objects.create(
            email=validated_data['email'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            phone_number=validated_data.get('phone_number', ''),
            role=validated_data['role'],
            department=department,
            tenant_id=tenant_id
        )
        
        user.set_password(validated_data['password'])
        user.save()
        
        # Associate user with tenant
        TenantUser.objects.create(
            user=user,
            tenant=tenant,
            role=validated_data['role'],
            industry=industry
        )
        
        return user