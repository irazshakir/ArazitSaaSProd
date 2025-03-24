from django.urls import path
from . import views

app_name = 'waba_int'

urlpatterns = [
    path('groups/', views.GroupView.as_view(), name='groups'),
    path('templates/', views.TemplateView.as_view(), name='templates'),
    path('chats/', views.ChatListView.as_view(), name='chat-list'),
    path('messages/<int:contact_id>/', views.ChatMessageView.as_view(), name='chat-messages'),
    path('contacts/', views.ContactView.as_view(), name='contacts'),
    path('contacts/single/', views.SingleContactView.as_view(), name='single-contact'),
    path('messages/send/', views.SendMessageView.as_view(), name='send-message'),
    path('messages/send-image/', views.SendImageMessageView.as_view(), name='send-image-message'),
    path('conversations/', views.ConversationListView.as_view(), name='conversations'),
]

print("WABA_INT URL patterns loaded:", urlpatterns)  # Debug print