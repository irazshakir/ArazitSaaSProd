# Generated by Django 4.2.7 on 2025-05-29 19:48

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('users', '0001_initial'),
        ('leads', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('invoices', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='paymenthistory',
            name='recorded_by',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='recorded_payments', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='paymenthistory',
            name='tenant',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='payment_histories', to='users.tenant'),
        ),
        migrations.AddField(
            model_name='invoice',
            name='created_by',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='created_invoices', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='invoice',
            name='lead',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='invoices', to='leads.lead'),
        ),
        migrations.AddField(
            model_name='invoice',
            name='tenant',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='invoices', to='users.tenant'),
        ),
    ]
