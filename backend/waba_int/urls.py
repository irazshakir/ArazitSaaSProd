from django.urls import path
from . import views

app_name = 'waba_int'

urlpatterns = [
    path('templates/', views.TemplateView.as_view(), name='templates'),
    path('chats/', views.ChatListView.as_view(), name='chat-list'),
    path('chats/<str:chat_id>/messages/', views.ChatMessageView.as_view(), name='chat-messages'),
]

print("WABA_INT URL patterns loaded:", urlpatterns)  # Debug print