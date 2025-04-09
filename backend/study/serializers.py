from rest_framework import serializers
from .models import StudyInquiry, StudyEligibility, StudyCost

class StudyCostSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudyCost
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')


class StudyEligibilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = StudyEligibility
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')


class StudyInquirySerializer(serializers.ModelSerializer):
    eligibility = StudyEligibilitySerializer(read_only=True)
    cost = StudyCostSerializer(read_only=True)
    
    class Meta:
        model = StudyInquiry
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')


class StudyInquiryCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a study inquiry with nested eligibility and cost."""
    
    eligibility = StudyEligibilitySerializer(required=False)
    cost = StudyCostSerializer(required=False)
    
    class Meta:
        model = StudyInquiry
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')
    
    def create(self, validated_data):
        eligibility_data = validated_data.pop('eligibility', None)
        cost_data = validated_data.pop('cost', None)
        
        # Create the study inquiry
        study_inquiry = StudyInquiry.objects.create(**validated_data)
        
        # Create eligibility if data provided
        if eligibility_data:
            StudyEligibility.objects.create(study_inquiry=study_inquiry, **eligibility_data)
        
        # Create cost if data provided
        if cost_data:
            StudyCost.objects.create(study_inquiry=study_inquiry, **cost_data)
        
        return study_inquiry 