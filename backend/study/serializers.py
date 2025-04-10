from rest_framework import serializers
from .models import Study

class StudySerializer(serializers.ModelSerializer):
    class Meta:
        model = Study
        fields = [
            'id', 
            'last_qualification', 
            'last_qualification_yr', 
            'ielts_score', 
            'study_program', 
            'country', 
            'student_assesment', 
            'can_manage_bs', 
            'consultation_cost',
            'lead_inquiry',
            'created_at',
            'updated_at'
        ]
        
class CreateStudySerializer(serializers.ModelSerializer):
    last_qualification = serializers.CharField(max_length=255, allow_blank=True, required=False, default='')
    last_qualification_yr = serializers.IntegerField(allow_null=True, required=False)
    ielts_score = serializers.DecimalField(max_digits=3, decimal_places=1, allow_null=True, required=False)
    study_program = serializers.CharField(max_length=255, allow_blank=True, required=False, default='')
    country = serializers.CharField(max_length=100, allow_blank=True, required=False, default='')
    student_assesment = serializers.CharField(allow_blank=True, required=False, default='')
    can_manage_bs = serializers.BooleanField(default=False, required=False)
    consultation_cost = serializers.DecimalField(max_digits=10, decimal_places=2, default=0, required=False)
    
    class Meta:
        model = Study
        fields = [
            'id', 
            'last_qualification', 
            'last_qualification_yr', 
            'ielts_score', 
            'study_program', 
            'country', 
            'student_assesment', 
            'can_manage_bs', 
            'consultation_cost',
            'lead_inquiry'
        ]
    
    def validate(self, data):
        # Ensure default values for any missing fields
        if 'last_qualification' not in data:
            data['last_qualification'] = ''
        if 'study_program' not in data:
            data['study_program'] = ''
        if 'country' not in data:
            data['country'] = ''
        if 'student_assesment' not in data:
            data['student_assesment'] = ''
        if 'can_manage_bs' not in data:
            data['can_manage_bs'] = False
        if 'consultation_cost' not in data:
            data['consultation_cost'] = 0
        
        return data
    
    def create(self, validated_data):
        # Create study record with lead inquiry reference
        study = Study.objects.create(**validated_data)
        return study 