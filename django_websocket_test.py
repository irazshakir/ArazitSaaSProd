#!/usr/bin/env python
"""
Django Channels WebSocket Broadcasting Test Script

This script tests the Django Channels broadcasting mechanism by directly calling
the broadcast functions in your Django project. To use this:

1. Copy this file to your Django project directory
2. Run it with the Django shell:
   python manage.py shell < django_websocket_test.py
"""

import json
import uuid
import sys
from datetime import datetime
from django.utils import timezone

# Test if we're running in Django context
try:
    from channels.layers import get_channel_layer
    from asgiref.sync import async_to_sync
    from waba_int.views import broadcast_new_message, broadcast_new_chat
except ImportError:
    print("❌ This script must be run in Django context.")
    print("Run it using: python manage.py shell < django_websocket_test.py")
    sys.exit(1)

def print_header(title):
    print("\n" + "="*50)
    print(title)
    print("="*50)

def test_direct_channel_layer():
    """Test the channel layer directly"""
    print_header("TESTING CHANNEL LAYER DIRECTLY")
    
    try:
        # Get the channel layer
        channel_layer = get_channel_layer()
        print(f"Channel layer type: {type(channel_layer).__name__}")
        
        # Generate a test group name
        test_group = f"test_group_{uuid.uuid4().hex[:8]}"
        print(f"Test group name: {test_group}")
        
        # Test message
        test_message = {
            "type": "test_message",
            "data": {
                "id": str(uuid.uuid4()),
                "text": "Test message from django_websocket_test.py",
                "timestamp": timezone.now().isoformat()
            }
        }
        
        # Send the message
        print(f"Sending test message to group: {test_group}")
        print(f"Message data: {json.dumps(test_message, indent=2)}")
        
        async_to_sync(channel_layer.group_send)(
            test_group,
            test_message
        )
        
        print("✅ Message sent successfully to channel layer")
        print("Note: This doesn't confirm message delivery to clients")
        
    except Exception as e:
        print(f"❌ Error testing channel layer: {str(e)}")
        import traceback
        traceback.print_exc()

def test_broadcast_functions():
    """Test the application's broadcast functions"""
    print_header("TESTING BROADCAST FUNCTIONS")
    
    # You need to provide a valid tenant ID here
    tenant_id = input("Enter a valid tenant ID: ").strip()
    if not tenant_id:
        print("❌ Tenant ID is required.")
        return
    
    # Test message data
    message_data = {
        "id": f"test_{uuid.uuid4()}",
        "conversation_id": "123456789",
        "sender_name": "Test Contact",
        "text": "Test message from broadcast function",
        "timestamp": timezone.now().isoformat(),
        "is_from_me": False
    }
    
    # Test chat data
    chat_data = {
        "id": "123456789",
        "name": "Test Contact",
        "phone": "+1234567890",
        "lastMessage": "Test new chat from broadcast function",
        "lastMessageTime": timezone.now().strftime('%I:%M %p'),
        "unread": True
    }
    
    # Test broadcasting a message
    try:
        print("Testing broadcast_new_message function...")
        print(f"Tenant ID: {tenant_id}")
        print(f"Message data: {json.dumps(message_data, indent=2)}")
        
        result = broadcast_new_message(tenant_id, message_data)
        print(f"Result: {result}")
        print("✅ broadcast_new_message completed")
    except Exception as e:
        print(f"❌ Error in broadcast_new_message: {str(e)}")
        import traceback
        traceback.print_exc()
    
    # Test broadcasting a chat
    try:
        print("\nTesting broadcast_new_chat function...")
        print(f"Tenant ID: {tenant_id}")
        print(f"Chat data: {json.dumps(chat_data, indent=2)}")
        
        result = broadcast_new_chat(tenant_id, chat_data)
        print(f"Result: {result}")
        print("✅ broadcast_new_chat completed")
    except Exception as e:
        print(f"❌ Error in broadcast_new_chat: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("\n🔍 Testing Django Channels WebSocket Broadcasting")
    print("This script must be run in Django context using:")
    print("python manage.py shell < django_websocket_test.py\n")
    
    test_direct_channel_layer()
    test_broadcast_functions() 