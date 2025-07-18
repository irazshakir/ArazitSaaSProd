# Generated by Django 4.2.7 on 2025-05-29 19:48

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('users', '0001_initial'),
        ('generalProduct', '0002_initial'),
        ('leads', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('hajjPackages', '0002_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='notification',
            name='tenant',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='notifications', to='users.tenant'),
        ),
        migrations.AddField(
            model_name='notification',
            name='user',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='notifications', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='leadprofile',
            name='lead',
            field=models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='profile', to='leads.lead'),
        ),
        migrations.AddField(
            model_name='leadprofile',
            name='tenant',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='lead_profiles', to='users.tenant'),
        ),
        migrations.AddField(
            model_name='leadoverdue',
            name='lead',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='overdue_records', to='leads.lead'),
        ),
        migrations.AddField(
            model_name='leadoverdue',
            name='lead_user',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='overdue_leads', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='leadoverdue',
            name='tenant',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='lead_overdues', to='users.tenant'),
        ),
        migrations.AddField(
            model_name='leadnote',
            name='added_by',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='lead_notes', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='leadnote',
            name='lead',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='notes', to='leads.lead'),
        ),
        migrations.AddField(
            model_name='leadnote',
            name='tenant',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='lead_notes', to='users.tenant'),
        ),
        migrations.AddField(
            model_name='leadevent',
            name='lead',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='events', to='leads.lead'),
        ),
        migrations.AddField(
            model_name='leadevent',
            name='tenant',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='lead_events', to='users.tenant'),
        ),
        migrations.AddField(
            model_name='leadevent',
            name='updated_by',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='lead_events', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='leaddocument',
            name='lead',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='documents', to='leads.lead'),
        ),
        migrations.AddField(
            model_name='leaddocument',
            name='tenant',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='lead_documents', to='users.tenant'),
        ),
        migrations.AddField(
            model_name='leaddocument',
            name='uploaded_by',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='uploaded_lead_documents', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='leadactivity',
            name='lead',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='activities', to='leads.lead'),
        ),
        migrations.AddField(
            model_name='leadactivity',
            name='tenant',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='lead_activities', to='users.tenant'),
        ),
        migrations.AddField(
            model_name='leadactivity',
            name='user',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='lead_activities', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='lead',
            name='assigned_to',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='assigned_leads', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='lead',
            name='branch',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='branch_leads', to='users.branch'),
        ),
        migrations.AddField(
            model_name='lead',
            name='created_by',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='created_leads', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='lead',
            name='department',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='department_leads', to='users.department'),
        ),
        migrations.AddField(
            model_name='lead',
            name='general_product',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='leads', to='generalProduct.generalproduct'),
        ),
        migrations.AddField(
            model_name='lead',
            name='hajj_package',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='leads', to='hajjPackages.hajjpackage'),
        ),
        migrations.AddField(
            model_name='lead',
            name='tenant',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='leads', to='users.tenant'),
        ),
        migrations.AddIndex(
            model_name='notification',
            index=models.Index(fields=['user', 'status'], name='leads_notif_user_id_26ddb3_idx'),
        ),
        migrations.AddIndex(
            model_name='notification',
            index=models.Index(fields=['created_at'], name='leads_notif_created_cf7cf5_idx'),
        ),
        migrations.AddIndex(
            model_name='leadevent',
            index=models.Index(fields=['event_type'], name='leads_leade_event_t_0987d8_idx'),
        ),
        migrations.AddIndex(
            model_name='leadevent',
            index=models.Index(fields=['timestamp'], name='leads_leade_timesta_95a9b4_idx'),
        ),
        migrations.AddIndex(
            model_name='lead',
            index=models.Index(fields=['tenant', 'phone'], name='leads_lead_tenant__d4b2e7_idx'),
        ),
        migrations.AddIndex(
            model_name='lead',
            index=models.Index(fields=['tenant', 'whatsapp'], name='leads_lead_tenant__50a3d1_idx'),
        ),
        migrations.AddIndex(
            model_name='lead',
            index=models.Index(fields=['tenant', 'status'], name='leads_lead_tenant__054659_idx'),
        ),
        migrations.AddIndex(
            model_name='lead',
            index=models.Index(fields=['tenant', 'created_at'], name='leads_lead_tenant__5e5f75_idx'),
        ),
        migrations.AddIndex(
            model_name='lead',
            index=models.Index(fields=['lead_type'], name='leads_lead_lead_ty_f6ba1c_idx'),
        ),
        migrations.AddIndex(
            model_name='lead',
            index=models.Index(fields=['created_at'], name='leads_lead_created_302c6d_idx'),
        ),
        migrations.AddIndex(
            model_name='lead',
            index=models.Index(fields=['lead_activity_status'], name='leads_lead_lead_ac_3f948c_idx'),
        ),
        migrations.AddIndex(
            model_name='lead',
            index=models.Index(fields=['chat_id'], name='leads_lead_chat_id_f2a949_idx'),
        ),
        migrations.AddIndex(
            model_name='lead',
            index=models.Index(fields=['branch'], name='leads_lead_branch__9ddaaa_idx'),
        ),
        migrations.AddConstraint(
            model_name='lead',
            constraint=models.UniqueConstraint(fields=('tenant', 'phone'), name='unique_tenant_phone'),
        ),
        migrations.AddConstraint(
            model_name='lead',
            constraint=models.UniqueConstraint(condition=models.Q(('whatsapp__isnull', False)), fields=('tenant', 'whatsapp'), name='unique_tenant_whatsapp'),
        ),
    ]
