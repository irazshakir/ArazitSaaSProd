# Generated by Django 4.2.7 on 2025-05-29 19:48

from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Lead',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('lead_type', models.CharField(default='hajj_package', help_text='Lead type - can be predefined or from general products', max_length=50)),
                ('development_project', models.CharField(blank=True, help_text='Development project ID for real estate leads', max_length=255, null=True)),
                ('flight', models.JSONField(blank=True, help_text='Flight details for flight leads', null=True)),
                ('name', models.CharField(max_length=200)),
                ('email', models.EmailField(blank=True, max_length=254, null=True)),
                ('phone', models.CharField(max_length=20)),
                ('whatsapp', models.CharField(blank=True, max_length=20, null=True)),
                ('query_for', models.JSONField(default=dict, help_text='Stores details like adults, children, infants, initial remarks')),
                ('status', models.CharField(choices=[('new', 'New'), ('qualified', 'Qualified'), ('non_potential', 'Non-Potential'), ('proposal', 'Proposal'), ('negotiation', 'Negotiation'), ('won', 'Won'), ('lost', 'Lost')], default='new', max_length=20)),
                ('source', models.CharField(choices=[('fb_form', 'FB Form'), ('messenger', 'Messenger'), ('whatsapp', 'WhatsApp'), ('insta_form', 'Insta Form'), ('website_form', 'Website Form'), ('website_chat', 'Website Chat'), ('referral', 'Referral'), ('walk_in', 'Walk In')], default='website_form', max_length=20)),
                ('lead_activity_status', models.CharField(choices=[('active', 'Active'), ('inactive', 'Inactive')], default='active', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('last_contacted', models.DateTimeField(blank=True, null=True)),
                ('next_follow_up', models.DateTimeField(blank=True, null=True)),
                ('tags', models.JSONField(blank=True, help_text='Custom tags to categorize leads', null=True)),
                ('custom_fields', models.JSONField(blank=True, help_text='Dynamic custom fields specific to tenant or lead type', null=True)),
                ('chat_id', models.CharField(blank=True, help_text='WhatsApp chat ID if lead originated from WhatsApp', max_length=255, null=True)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='LeadActivity',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('activity_type', models.CharField(max_length=100)),
                ('description', models.TextField()),
                ('due_date', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name_plural': 'Lead Activities',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='LeadDocument',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('document_name', models.CharField(help_text='Name or description of the document', max_length=255)),
                ('document_path', models.FileField(upload_to='lead_documents/')),
                ('timestamp', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'ordering': ['-timestamp'],
            },
        ),
        migrations.CreateModel(
            name='LeadEvent',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('event_type', models.CharField(choices=[('open', 'Open'), ('closed', 'Closed'), ('reopened', 'Reopened'), ('won', 'Won'), ('lost', 'Lost')], max_length=20)),
                ('timestamp', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'ordering': ['-timestamp'],
            },
        ),
        migrations.CreateModel(
            name='LeadNote',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('note', models.TextField()),
                ('timestamp', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'ordering': ['-timestamp'],
            },
        ),
        migrations.CreateModel(
            name='LeadOverdue',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('overdue', models.BooleanField(default=True)),
                ('timestamp', models.DateTimeField(auto_now_add=True)),
                ('resolved_at', models.DateTimeField(blank=True, null=True)),
            ],
            options={
                'ordering': ['-timestamp'],
            },
        ),
        migrations.CreateModel(
            name='LeadProfile',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('qualified_lead', models.BooleanField(default=False)),
                ('buying_level', models.CharField(choices=[('high', 'High'), ('medium', 'Medium'), ('low', 'Low'), ('very_low', 'Very Low')], default='medium', max_length=20)),
                ('previous_purchase', models.BooleanField(default=False)),
                ('previous_purchase_amount', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),
                ('engagement_score', models.PositiveSmallIntegerField(default=0, help_text='Score based on engagement level (0-100)')),
                ('response_time_score', models.PositiveSmallIntegerField(default=0, help_text='Score based on response time (0-100)')),
                ('budget_match_score', models.PositiveSmallIntegerField(default=0, help_text='Score based on budget match (0-100)')),
                ('overall_score', models.PositiveSmallIntegerField(default=0, help_text='Overall lead score (0-100)')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'ordering': ['-overall_score'],
            },
        ),
        migrations.CreateModel(
            name='Notification',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('notification_type', models.CharField(choices=[('lead_assigned', 'Lead Assigned'), ('lead_overdue', 'Lead Overdue'), ('activity_reminder', 'Activity Reminder')], max_length=50)),
                ('title', models.CharField(max_length=255)),
                ('message', models.TextField()),
                ('status', models.CharField(choices=[('unread', 'Unread'), ('read', 'Read')], default='unread', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('read_at', models.DateTimeField(blank=True, null=True)),
                ('lead', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='notifications', to='leads.lead')),
                ('lead_activity', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='notifications', to='leads.leadactivity')),
                ('lead_overdue', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='notifications', to='leads.leadoverdue')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
