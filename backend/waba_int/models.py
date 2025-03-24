from django.db import models

class Chat(models.Model):
    chat_id = models.CharField(max_length=255, unique=True)
    customer_name = models.CharField(max_length=255)
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()
    
    def __str__(self):
        return f"Chat {self.chat_id} - {self.customer_name}"
    
    class Meta:
        ordering = ['-updated_at']

class Message(models.Model):
    chat = models.ForeignKey(Chat, on_delete=models.CASCADE, related_name='messages')
    message_id = models.CharField(max_length=255, unique=True)
    sender = models.CharField(max_length=255)
    content = models.TextField()
    timestamp = models.DateTimeField()
    
    def __str__(self):
        return f"Message {self.message_id} in {self.chat.chat_id}"
    
    class Meta:
        ordering = ['timestamp']
