from django.shortcuts import render
from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from .models import CannedMessage
from .serializers import CannedMessageSerializer
from users.models import Tenant


class CannedMessageViewSet(viewsets.ModelViewSet):
    """
    ViewSet for the CannedMessage model, handling CRUD operations
    with tenant-specific filtering and permissions.
    """
    serializer_class = CannedMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_tenant(self):
        """Helper method to get tenant from user relationship or header"""
        # First try to get from user relationship
        tenant_user = self.request.user.tenant_users.first()
        if tenant_user:
            return tenant_user.tenant
            
        # If not found, try to get from header
        tenant_id = self.request.headers.get('X-Tenant-ID')
        if tenant_id:
            try:
                return Tenant.objects.get(id=tenant_id)
            except Tenant.DoesNotExist:
                return None
                
        return None

    def get_queryset(self):
        """
        Filter queryset to only return canned messages
        for the user's tenant
        """
        try:
            tenant = self.get_tenant()
            if not tenant:
                return CannedMessage.objects.none()
            
            # Filter by tenant and apply any additional filters
            queryset = CannedMessage.objects.filter(tenant=tenant)
            
            # Optional filter by active status if specified in query params
            is_active = self.request.query_params.get('is_active', None)
            if is_active is not None:
                is_active = is_active.lower() == 'true'
                queryset = queryset.filter(is_active=is_active)
                
            return queryset
        except Exception:
            return CannedMessage.objects.none()

    def perform_create(self, serializer):
        """
        Set the tenant and created_by fields automatically
        when creating a new canned message
        """
        tenant = self.get_tenant()
        if not tenant:
            return Response(
                {"error": "No tenant found for user"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer.save(
            tenant=tenant,
            created_by=self.request.user
        )

    @action(detail=True, methods=['patch'])
    def toggle_active(self, request, pk=None):
        """
        Toggle the is_active status of a canned message
        """
        # Get the tenant
        tenant = self.get_tenant()
        if not tenant:
            return Response(
                {"error": "No tenant found for user"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get the canned message for this tenant
        canned_message = get_object_or_404(
            CannedMessage, 
            id=pk,
            tenant=tenant
        )
        
        # Toggle the is_active status
        canned_message.is_active = not canned_message.is_active
        canned_message.save()
        
        serializer = self.get_serializer(canned_message)
        return Response(serializer.data)
