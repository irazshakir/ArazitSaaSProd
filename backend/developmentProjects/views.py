from django.shortcuts import render
from rest_framework import viewsets, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import DevelopmentProject
from .serializers import DevelopmentProjectSerializer

# Create your views here.

class DevelopmentProjectViewSet(viewsets.ModelViewSet):
    """ViewSet for managing development projects"""
    serializer_class = DevelopmentProjectSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        Filter projects by tenant_id of the authenticated user.
        """
        tenant_id = self.request.user.tenant_id
        return DevelopmentProject.objects.filter(tenant_id=tenant_id)
    
    def perform_create(self, serializer):
        """Set tenant_id to the user's tenant_id when creating a project"""
        serializer.save(tenant_id=self.request.user.tenant_id)
    
    @action(detail=False, methods=['get'])
    def property_types(self, request):
        """API endpoint to get all property types"""
        return Response(dict(DevelopmentProject.PROPERTY_TYPE_CHOICES))
    
    @action(detail=False, methods=['get'])
    def listing_types(self, request):
        """API endpoint to get all listing types"""
        return Response(dict(DevelopmentProject.LISTING_TYPE_CHOICES))
