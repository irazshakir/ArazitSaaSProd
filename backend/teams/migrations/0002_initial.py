# Generated by Django 4.2.7 on 2025-05-29 19:48

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('users', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('teams', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='teammember',
            name='member',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='team_memberships', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='teammember',
            name='team',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='members', to='teams.team'),
        ),
        migrations.AddField(
            model_name='teammember',
            name='team_lead',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='team_members', to='teams.teamlead'),
        ),
        migrations.AddField(
            model_name='teammanager',
            name='manager',
            field=models.ForeignKey(limit_choices_to={'role': 'manager'}, on_delete=django.db.models.deletion.CASCADE, related_name='managed_teams', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='teammanager',
            name='team',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='managers', to='teams.team'),
        ),
        migrations.AddField(
            model_name='teamlead',
            name='manager',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='team_leads', to='teams.teammanager'),
        ),
        migrations.AddField(
            model_name='teamlead',
            name='team',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='team_leads', to='teams.team'),
        ),
        migrations.AddField(
            model_name='teamlead',
            name='team_lead',
            field=models.ForeignKey(limit_choices_to={'role': 'team_lead'}, on_delete=django.db.models.deletion.CASCADE, related_name='led_teams', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='team',
            name='branch',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='teams', to='users.branch'),
        ),
        migrations.AddField(
            model_name='team',
            name='department',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='teams', to='users.department'),
        ),
        migrations.AddField(
            model_name='team',
            name='department_head',
            field=models.ForeignKey(blank=True, limit_choices_to={'role': 'department_head'}, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='headed_teams', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='team',
            name='tenant',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='teams', to='users.tenant'),
        ),
        migrations.AlterUniqueTogether(
            name='teammember',
            unique_together={('team', 'member')},
        ),
        migrations.AlterUniqueTogether(
            name='teammanager',
            unique_together={('team', 'manager')},
        ),
        migrations.AlterUniqueTogether(
            name='teamlead',
            unique_together={('team', 'team_lead')},
        ),
        migrations.AlterUniqueTogether(
            name='team',
            unique_together={('name', 'department', 'branch', 'tenant')},
        ),
    ]
