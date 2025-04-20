from django.urls import path
from .views import (
    FacebookWebhookView, 
    FacebookWebhookHistoryListView, 
    FacebookWebhookHistoryDetailView,
    FacebookIntegrationSettingsView
)

app_name = 'fb_webhook'

urlpatterns = [
    # Settings endpoint
    path('webhook/facebook/settings/', FacebookIntegrationSettingsView.as_view(), name='facebook_settings'),
    
    # Webhook endpoints - support both with and without trailing slash
    path('webhook/facebook/<uuid:tenant_id>', FacebookWebhookView.as_view(), name='facebook_webhook_no_slash'),
    path('webhook/facebook/<uuid:tenant_id>/', FacebookWebhookView.as_view(), name='facebook_webhook'),
    
    # Admin endpoints for viewing webhook history
    path('webhook/facebook/history/', FacebookWebhookHistoryListView.as_view(), name='facebook_webhook_history_list'),
    path('webhook/facebook/history/<uuid:pk>/', FacebookWebhookHistoryDetailView.as_view(), name='facebook_webhook_history_detail'),
] 