from django.contrib import admin
from .models import Study

@admin.register(Study)
class StudyAdmin(admin.ModelAdmin):
    list_display = ['study_program', 'country', 'last_qualification', 'ielts_score', 'can_manage_bs', 'consultation_cost']
    list_filter = ['country', 'can_manage_bs']
    search_fields = ['study_program', 'country', 'student_assesment']
