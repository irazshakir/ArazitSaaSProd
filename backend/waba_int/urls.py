from django.urls import path
from .views import (
    GroupView, TemplateView, ChatListView, ChatMessageView, 
    ContactView, SingleContactView, SendMessageView,
    SendImageMessageView, ConversationListView, ChatLeadView
)

app_name = 'waba_int'

urlpatterns = [
    path('groups/', GroupView.as_view(), name='groups'),
    path('templates/', TemplateView.as_view(), name='templates'),
    path('chats/', ChatListView.as_view(), name='chats'),
    path('messages/<int:contact_id>/', ChatMessageView.as_view(), name='chat_messages'),
    path('contacts/', ContactView.as_view(), name='contacts'),
    path('contact/', SingleContactView.as_view(), name='single_contact'),
    path('messages/send/', SendMessageView.as_view(), name='send_message'),
    path('messages/send-image/', SendImageMessageView.as_view(), name='send_image'),
    path('conversations/', ConversationListView.as_view(), name='conversations'),
    path('lead/<int:contact_id>/', ChatLeadView.as_view(), name='chat_lead'),
]

print("WABA_INT URL patterns loaded:", urlpatterns)  # Debug print