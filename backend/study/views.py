from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import StudyInquiry, StudyEligibility, StudyCost
from .serializers import (
    StudyInquirySerializer, 
    StudyInquiryCreateSerializer,
    StudyEligibilitySerializer,
    StudyCostSerializer
)

class StudyInquiryViewSet(viewsets.ModelViewSet):
    """ViewSet for managing study inquiries."""
    
    queryset = StudyInquiry.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return StudyInquiryCreateSerializer
        return StudyInquirySerializer
    
    def get_queryset(self):
        """Filter inquiries by user's tenant."""
        user = self.request.user
        return StudyInquiry.objects.filter(
            lead_inquiry__tenant__in=user.tenant_users.values_list('tenant', flat=True)
        )
    
    @action(detail=True, methods=['get'])
    def eligibility(self, request, pk=None):
        """Get eligibility details for a study inquiry."""
        inquiry = self.get_object()
        try:
            eligibility = inquiry.eligibility
            serializer = StudyEligibilitySerializer(eligibility)
            return Response(serializer.data)
        except StudyEligibility.DoesNotExist:
            return Response({'detail': 'Eligibility not found'}, status=404)
    
    @action(detail=True, methods=['get'])
    def cost(self, request, pk=None):
        """Get cost details for a study inquiry."""
        inquiry = self.get_object()
        try:
            cost = inquiry.cost
            serializer = StudyCostSerializer(cost)
            return Response(serializer.data)
        except StudyCost.DoesNotExist:
            return Response({'detail': 'Cost details not found'}, status=404)


class StudyEligibilityViewSet(viewsets.ModelViewSet):
    """ViewSet for managing study eligibility."""
    
    queryset = StudyEligibility.objects.all()
    serializer_class = StudyEligibilitySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter eligibility records by user's tenant."""
        user = self.request.user
        return StudyEligibility.objects.filter(
            study_inquiry__lead_inquiry__tenant__in=user.tenant_users.values_list('tenant', flat=True)
        )


class StudyCostViewSet(viewsets.ModelViewSet):
    """ViewSet for managing study costs."""
    
    queryset = StudyCost.objects.all()
    serializer_class = StudyCostSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter cost records by user's tenant."""
        user = self.request.user
        return StudyCost.objects.filter(
            study_inquiry__lead_inquiry__tenant__in=user.tenant_users.values_list('tenant', flat=True)
        ) 