# Generated by Django 4.2.7 on 2025-05-29 19:48

from django.db import migrations, models
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='DevelopmentProject',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('tenant_id', models.UUIDField(help_text='ID of the tenant account')),
                ('project_name', models.CharField(max_length=255)),
                ('property_type', models.CharField(choices=[('residential', 'Residential'), ('commercial', 'Commercial')], max_length=20)),
                ('listing_type', models.CharField(choices=[('house', 'House'), ('flat', 'Flat'), ('shop', 'Shop'), ('building', 'Building'), ('farmhouse', 'Farmhouse'), ('plot', 'Plot')], max_length=20)),
                ('location', models.CharField(max_length=255)),
                ('covered_size', models.CharField(help_text="Size of the property (e.g., '1500 sq ft')", max_length=100)),
                ('features', models.TextField(blank=True, null=True)),
                ('project_image', models.ImageField(blank=True, null=True, upload_to='development_projects/')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
        ),
    ]
