import uuid
from django.db import models
from leads.models import Lead

class StudyInquiry(models.Model):
    """Model for tracking study visa inquiries."""
    
    # Qualification choices
    QUALIFICATION_PHD = 'phd'
    QUALIFICATION_PHIL = 'phil'
    QUALIFICATION_MSC = 'msc'
    QUALIFICATION_MA = 'ma'
    QUALIFICATION_MCOM = 'mcom'
    QUALIFICATION_MCS = 'mcs'
    QUALIFICATION_MBBS = 'mbbs'
    QUALIFICATION_BSC = 'bsc'
    QUALIFICATION_BA = 'ba'
    QUALIFICATION_BCS = 'bcs'
    QUALIFICATION_BSIT = 'bsit'
    QUALIFICATION_BCOM = 'bcom'
    QUALIFICATION_CA = 'ca'
    QUALIFICATION_FA = 'fa'
    QUALIFICATION_FSC = 'fsc'
    QUALIFICATION_METRIC = 'metric'
    QUALIFICATION_OTHER = 'other'
    
    QUALIFICATION_CHOICES = [
        (QUALIFICATION_PHD, 'PhD'),
        (QUALIFICATION_PHIL, 'Phil'),
        (QUALIFICATION_MSC, 'MSc'),
        (QUALIFICATION_MA, 'MA'),
        (QUALIFICATION_MCOM, 'MCom'),
        (QUALIFICATION_MCS, 'MCS'),
        (QUALIFICATION_MBBS, 'MBBS'),
        (QUALIFICATION_BSC, 'BSc'),
        (QUALIFICATION_BA, 'BA'),
        (QUALIFICATION_BCS, 'BCS'),
        (QUALIFICATION_BSIT, 'BSIT'),
        (QUALIFICATION_BCOM, 'BCom'),
        (QUALIFICATION_CA, 'CA'),
        (QUALIFICATION_FA, 'FA'),
        (QUALIFICATION_FSC, 'FSc'),
        (QUALIFICATION_METRIC, 'Metric'),
        (QUALIFICATION_OTHER, 'Other'),
    ]
    
    # Country choices
    COUNTRY_USA = 'usa'
    COUNTRY_CANADA = 'canada'
    COUNTRY_UK = 'uk'
    COUNTRY_ITALY = 'italy'
    COUNTRY_FRANCE = 'france'
    COUNTRY_SWEDEN = 'sweden'
    COUNTRY_CHINA = 'china'
    COUNTRY_TURKEY = 'turkey'
    COUNTRY_MALAYSIA = 'malaysia'
    COUNTRY_AUSTRALIA = 'australia'
    COUNTRY_NEW_ZEALAND = 'new_zealand'
    COUNTRY_OTHER = 'other'
    
    COUNTRY_CHOICES = [
        (COUNTRY_USA, 'USA'),
        (COUNTRY_CANADA, 'Canada'),
        (COUNTRY_UK, 'UK'),
        (COUNTRY_ITALY, 'Italy'),
        (COUNTRY_FRANCE, 'France'),
        (COUNTRY_SWEDEN, 'Sweden'),
        (COUNTRY_CHINA, 'China'),
        (COUNTRY_TURKEY, 'Turkey'),
        (COUNTRY_MALAYSIA, 'Malaysia'),
        (COUNTRY_AUSTRALIA, 'Australia'),
        (COUNTRY_NEW_ZEALAND, 'New Zealand'),
        (COUNTRY_OTHER, 'Other'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    lead_inquiry = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='study_inquiries')
    last_qualification = models.CharField(max_length=20, choices=QUALIFICATION_CHOICES)
    country = models.CharField(max_length=20, choices=COUNTRY_CHOICES)
    notes = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Study Inquiry'
        verbose_name_plural = 'Study Inquiries'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.lead_inquiry.name} - {self.get_country_display()}"


class StudyEligibility(models.Model):
    """Model for tracking study visa eligibility."""
    
    # IELTS requirement choices
    IELTS_YES = 'yes'
    IELTS_NO = 'no'
    IELTS_NOT_REQUIRED = 'not_required'
    
    IELTS_CHOICES = [
        (IELTS_YES, 'Yes'),
        (IELTS_NO, 'No'),
        (IELTS_NOT_REQUIRED, 'Not Required'),
    ]
    
    # Educational requirements choices
    EDU_COMPLETED = 'completed'
    EDU_NOT_COMPLETED = 'not_completed'
    EDU_NOT_REQUIRED = 'not_required'
    
    EDU_CHOICES = [
        (EDU_COMPLETED, 'Completed'),
        (EDU_NOT_COMPLETED, 'Not Completed'),
        (EDU_NOT_REQUIRED, 'Not Required'),
    ]
    
    # Final assessment choices
    ASSESSMENT_ELIGIBLE = 'eligible'
    ASSESSMENT_NOT_ELIGIBLE = 'not_eligible'
    
    ASSESSMENT_CHOICES = [
        (ASSESSMENT_ELIGIBLE, 'Eligible'),
        (ASSESSMENT_NOT_ELIGIBLE, 'Not Eligible'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    study_inquiry = models.OneToOneField(StudyInquiry, on_delete=models.CASCADE, related_name='eligibility')
    manage_bankstatement = models.BooleanField(default=False)
    required_ielts = models.CharField(max_length=20, choices=IELTS_CHOICES, default=IELTS_YES)
    educational_requirements = models.CharField(max_length=20, choices=EDU_CHOICES, default=EDU_NOT_COMPLETED)
    final_assessment = models.CharField(max_length=20, choices=ASSESSMENT_CHOICES, default=ASSESSMENT_NOT_ELIGIBLE)
    note = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Study Eligibility'
        verbose_name_plural = 'Study Eligibilities'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.study_inquiry.lead_inquiry.name} - {self.get_final_assessment_display()}"


class StudyCost(models.Model):
    """Model for tracking study visa costs."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    study_inquiry = models.OneToOneField(StudyInquiry, on_delete=models.CASCADE, related_name='cost')
    consultation_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    uni_rebate = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Study Cost'
        verbose_name_plural = 'Study Costs'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.study_inquiry.lead_inquiry.name} - Cost Details" 