from django.contrib import admin
from .models import StudyInquiry, StudyEligibility, StudyCost

@admin.register(StudyInquiry)
class StudyInquiryAdmin(admin.ModelAdmin):
    list_display = ('lead_inquiry', 'last_qualification', 'country', 'created_at')
    list_filter = ('country', 'last_qualification', 'created_at')
    search_fields = ('lead_inquiry__name', 'notes')
    date_hierarchy = 'created_at'


@admin.register(StudyEligibility)
class StudyEligibilityAdmin(admin.ModelAdmin):
    list_display = ('study_inquiry', 'manage_bankstatement', 'required_ielts', 'educational_requirements', 'final_assessment')
    list_filter = ('manage_bankstatement', 'required_ielts', 'educational_requirements', 'final_assessment')
    search_fields = ('study_inquiry__lead_inquiry__name', 'note')
    date_hierarchy = 'created_at'


@admin.register(StudyCost)
class StudyCostAdmin(admin.ModelAdmin):
    list_display = ('study_inquiry', 'consultation_cost', 'uni_rebate', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('study_inquiry__lead_inquiry__name',)
    date_hierarchy = 'created_at' 