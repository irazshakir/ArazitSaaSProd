from rest_framework import serializers
from .models import Chat, Message

class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ['id', 'message_id', 'sender', 'content', 'timestamp']

class ChatSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)
    
    class Meta:
        model = Chat
        fields = ['id', 'chat_id', 'customer_name', 'created_at', 'updated_at', 'messages']