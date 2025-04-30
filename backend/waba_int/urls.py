from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    GroupView, TemplateView, ChatListView, ChatMessageView, 
    ContactView, SingleContactView, SendMessageView,
    SendImageMessageView, ConversationListView, ChatLeadView,
    CreateLeadFromChatView, TenantDebugView, get_conversations,
    check_lead_departments, WABASettingsViewSet, get_users_for_assignment,
    assign_chat_to_user
    # webhook_handler  # Commented out as it doesn't exist
)

app_name = 'waba_int'

# Create a router for the WABASettingsViewSet
router = DefaultRouter()
router.register(r'settings', WABASettingsViewSet, basename='waba-settings')

urlpatterns = [
    path('groups/', GroupView.as_view(), name='groups'),
    path('templates/', TemplateView.as_view(), name='templates'),
    path('chats/', ChatListView.as_view(), name='chats'),
    path('messages/<int:contact_id>/', ChatMessageView.as_view(), name='chat_messages'),
    path('contacts/', ContactView.as_view(), name='contacts'),
    path('contact/', SingleContactView.as_view(), name='single_contact'),
    path('messages/send/', SendMessageView.as_view(), name='send_message'),
    path('messages/send-image/', SendImageMessageView.as_view(), name='send_image'),
    path('conversations/', get_conversations, name='conversations'),
    path('lead/<int:contact_id>/', ChatLeadView.as_view(), name='chat_lead'),
    path('debug-tenant/', TenantDebugView.as_view(), name='debug_tenant'),
    path('check-lead-departments/', check_lead_departments, name='check_lead_departments'),
    path('users-for-assignment/', get_users_for_assignment, name='users_for_assignment'),
    path('assign-chat/', assign_chat_to_user, name='assign_chat'),
    # path('webhook/', webhook_handler, name='whatsapp_webhook'),  # Commented out as the function doesn't exist
]

# Add the router URLs to the urlpatterns
urlpatterns += router.urls

print("WABA_INT URL patterns loaded:", urlpatterns)  

