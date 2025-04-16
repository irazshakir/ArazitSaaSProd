from django.db import models
from django.core.validators import RegexValidator

class CompanySettings(models.Model):
    tenant_id = models.CharField(max_length=100, unique=True)
    company_name = models.CharField(max_length=255)
    logo = models.ImageField(upload_to='company_logos/', null=True, blank=True)
    theme_color = models.CharField(max_length=7, validators=[
        RegexValidator(
            regex='^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$',
            message='Theme color must be a valid hex color code',
        )
    ])
    address = models.TextField()
    phone = models.CharField(max_length=17)
    email = models.EmailField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Company Settings'
        verbose_name_plural = 'Company Settings'

    def __str__(self):
        return f"{self.company_name} - {self.tenant_id}" 
    

    