from django.shortcuts import render, get_object_or_404
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Study
from .serializers import StudySerializer, CreateStudySerializer

# Create your views here.

class StudyViewSet(viewsets.ModelViewSet):
    queryset = Study.objects.all().select_related('lead_inquiry')
    serializer_class = StudySerializer
    permission_classes = [permissions.IsAuthenticated]
    basename = 'study'

    def get_serializer_class(self):
        if self.action == 'create' or self.action == 'create_for_lead':
            return CreateStudySerializer
        return StudySerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        # Filter by country
        country = self.request.query_params.get('country')
        if country:
            queryset = queryset.filter(country__icontains=country)
        
        # Filter by study program
        program = self.request.query_params.get('program')
        if program:
            queryset = queryset.filter(study_program__icontains=program)
            
        # Filter by qualification
        qualification = self.request.query_params.get('qualification')
        if qualification:
            queryset = queryset.filter(last_qualification__icontains=qualification)
            
        # Filter by can_manage_bs
        can_manage = self.request.query_params.get('can_manage')
        if can_manage is not None:
            can_manage_bool = can_manage.lower() == 'true'
            queryset = queryset.filter(can_manage_bs=can_manage_bool)
            
        # Filter by lead_inquiry
        lead_id = self.request.query_params.get('lead_id')
        if lead_id:
            queryset = queryset.filter(lead_inquiry=lead_id)
            
        return queryset
        
    @action(detail=False, methods=['post'], url_path='create-for-lead')
    def create_for_lead(self, request):
        """Create a study record for a specific lead"""
        # Accept either lead_id or lead_inquiry as the parameter
        lead_id = request.data.get('lead_id') or request.data.get('lead_inquiry')
        
        if not lead_id:
            return Response(
                {"error": "lead_id or lead_inquiry is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Include the lead_id in the data
        data = request.data.copy()
        data['lead_inquiry'] = lead_id
        
        # Print the data for debugging
        print(f"Creating study with data: {data}")
        
        serializer = CreateStudySerializer(data=data)
        if serializer.is_valid():
            study = serializer.save()
            print(f"Study created: {study}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        print(f"Serializer errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'], url_path='for-lead')
    def for_lead(self, request):
        """Get study details for a specific lead"""
        lead_id = request.query_params.get('lead_id')
        if not lead_id:
            return Response(
                {"error": "lead_id is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        study = Study.objects.filter(lead_inquiry=lead_id).first()
        if not study:
            return Response(
                {"error": "Study record not found for this lead"}, 
                status=status.HTTP_404_NOT_FOUND
            )
            
        serializer = self.get_serializer(study)
        return Response(serializer.data)
