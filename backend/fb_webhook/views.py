from rest_framework import views, status, generics, permissions
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from .serializers import (
    FacebookLeadWebhookSerializer, 
    FacebookWebhookHistorySerializer,
    FacebookIntegrationSettingsSerializer
)
from .models import FacebookWebhookHistory, FacebookIntegrationSettings
import logging
import json
import uuid

logger = logging.getLogger('fb_webhook')

class FacebookIntegrationSettingsView(generics.GenericAPIView):
    """View for managing Facebook integration settings for a tenant."""
    
    permission_classes = [IsAuthenticated]
    serializer_class = FacebookIntegrationSettingsSerializer
    
    def get_object(self):
        """Get Facebook integration settings for the tenant."""
        try:
            return FacebookIntegrationSettings.objects.get(tenant=self.request.user.tenant)
        except FacebookIntegrationSettings.DoesNotExist:
            return None

    def get(self, request, *args, **kwargs):
        """Get settings for the tenant."""
        instance = self.get_object()
        if not instance:
            return Response(
                {"detail": "Settings not found for this tenant"},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def post(self, request, *args, **kwargs):
        """Create settings for the tenant."""
        if self.get_object():
            return Response(
                {"detail": "Settings already exist. Use PUT to update."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(tenant=request.user.tenant)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def put(self, request, *args, **kwargs):
        """Update settings for the tenant."""
        instance = self.get_object()
        
        if not instance:
            instance = FacebookIntegrationSettings(tenant=request.user.tenant)
        
        serializer = self.get_serializer(instance, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def patch(self, request, *args, **kwargs):
        """Partially update settings for the tenant."""
        instance = self.get_object()
        if not instance:
            return Response(
                {"detail": "Settings not found for this tenant"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class FacebookWebhookView(views.APIView):
    """View for receiving webhook data from Facebook via Albato."""
    
    permission_classes = [AllowAny]
    
    def post(self, request, tenant_id):
        """Process the webhook data."""
        try:
            # Create webhook history record
            webhook_history = FacebookWebhookHistory.objects.create(
                tenant_id=tenant_id,
                raw_data=request.data or {}
            )
            
            # Get Facebook settings and verify signature
            try:
                settings = FacebookIntegrationSettings.objects.get(tenant_id=tenant_id)
                
                signature = request.headers.get('Signature') or request.META.get('HTTP_SIGNATURE')
                if not signature or signature != settings.webhook_secret:
                    webhook_history.error = "Invalid webhook signature"
                    webhook_history.save()
                    return Response(
                        {"status": "error", "message": "Invalid webhook signature"},
                        status=status.HTTP_401_UNAUTHORIZED
                    )
                
            except FacebookIntegrationSettings.DoesNotExist:
                webhook_history.error = "Facebook integration not configured"
                webhook_history.save()
                return Response(
                    {"status": "error", "message": "Facebook integration not configured"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Process the webhook data
            serializer = FacebookLeadWebhookSerializer(data={
                "tenant_id": tenant_id,
                "lead_data": request.data
            })
            
            if serializer.is_valid():
                webhook_history = serializer.save()
                if webhook_history.lead_created:
                    return Response({
                        "status": "success",
                        "message": "Lead created successfully",
                        "lead_id": str(webhook_history.lead_id),
                        "webhook_id": str(webhook_history.id)
                    }, status=status.HTTP_201_CREATED)
                else:
                    return Response({
                        "status": "warning",
                        "message": webhook_history.error,
                        "webhook_id": str(webhook_history.id)
                    }, status=status.HTTP_200_OK)
            else:
                webhook_history.error = str(serializer.errors)
                webhook_history.save()
                return Response({
                    "status": "error",
                    "message": "Invalid data",
                    "errors": serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            return Response({
                "status": "error",
                "message": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class FacebookWebhookHistoryListView(generics.ListAPIView):
    """View for listing webhook history records."""
    
    permission_classes = [IsAuthenticated]
    serializer_class = FacebookWebhookHistorySerializer
    
    def get_queryset(self):
        return FacebookWebhookHistory.objects.filter(tenant=self.request.user.tenant)


class FacebookWebhookHistoryDetailView(generics.RetrieveAPIView):
    """View for retrieving a single webhook history record."""
    
    permission_classes = [IsAuthenticated]
    serializer_class = FacebookWebhookHistorySerializer
    
    def get_queryset(self):
        return FacebookWebhookHistory.objects.filter(tenant=self.request.user.tenant) 