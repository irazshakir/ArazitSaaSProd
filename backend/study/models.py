from django.db import models

# Create your models here.

class Study(models.Model):
    last_qualification = models.CharField(max_length=255)
    last_qualification_yr = models.IntegerField()
    ielts_score = models.DecimalField(max_digits=3, decimal_places=1)
    study_program = models.CharField(max_length=255)
    country = models.CharField(max_length=100)
    student_assesment = models.TextField()
    can_manage_bs = models.BooleanField(default=False)
    consultation_cost = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    lead_inquiry = models.ForeignKey('leads.Lead', on_delete=models.CASCADE, related_name='study_details', null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Study'
        verbose_name_plural = 'Studies'

    def __str__(self):
        lead_id = self.lead_inquiry.id if self.lead_inquiry else 'No Lead'
        return f"{self.study_program} in {self.country} - Lead: {lead_id}"
