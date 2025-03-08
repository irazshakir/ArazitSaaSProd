from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.db.models import Q
from django.db import transaction

from users.models import User
from .models import HajjPackage
from .serializers import HajjPackageSerializer

class HajjPackageViewSet(viewsets.ModelViewSet):
    """
    ViewSet for HajjPackage model.
    Provides CRUD operations for Hajj Packages.
    """
    queryset = HajjPackage.objects.all()
    serializer_class = HajjPackageSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        This view should return a list of all the hajj packages
        for the currently authenticated user's tenant.
        """
        user = self.request.user
        return HajjPackage.objects.filter(tenant__in=user.tenant_users.values_list('tenant', flat=True))
    
    def perform_create(self, serializer):
        """Set the tenant based on the user's primary tenant."""
        user = self.request.user
        # Get the user's tenant where they are the owner or first active tenant
        tenant_user = user.tenant_users.filter(Q(role='owner') | Q(tenant__is_active=True)).first()
        
        if not tenant_user:
            raise ValidationError("User does not belong to any tenant")
            
        serializer.save(tenant=tenant_user.tenant)
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Return only active Hajj packages."""
        active_packages = self.get_queryset().filter(is_active=True)
        serializer = self.get_serializer(active_packages, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        """Assign a Hajj package to a user."""
        package = self.get_object()
        user_id = request.data.get('user_id')
        
        if not user_id:
            return Response(
                {"error": "User ID is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            # Check if the user belongs to the same tenant
            user = User.objects.get(
                id=user_id, 
                tenant_users__tenant=package.tenant
            )
            
            package.assigned_to = user
            package.save()
            
            serializer = self.get_serializer(package)
            return Response(serializer.data)
            
        except User.DoesNotExist:
            return Response(
                {"error": "User not found or does not belong to the same tenant"}, 
                status=status.HTTP_404_NOT_FOUND
            )
