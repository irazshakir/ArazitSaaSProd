#!/usr/bin/env python
import requests
import json
import sys
import uuid
import time
from datetime import datetime

# Configuration
WEBHOOK_URL = "https://api.arazit.com/api/webhook/"  # Update with your API URL
TENANT_ID = "ce781194-477e-4cb0-bf67-b438b735b81b"  # Update with your tenant ID

# Test data
test_message = {
    "tenant_id": TENANT_ID,
    "message": {
        "id": f"test_{uuid.uuid4()}",
        "conversation_id": "123456789",
        "text": "This is a test message from webhook_test.py script",
        "from_me": False,
        "timestamp": str(int(time.time()))
    },
    "contact": {
        "name": "Test Contact",
        "phone": "+1234567890"
    }
}

def send_webhook_test():
    """Send test webhook to the server"""
    print("\n" + "="*50)
    print(f"WEBHOOK TEST - {datetime.now().isoformat()}")
    print("="*50)
    
    print(f"\nSending test webhook to: {WEBHOOK_URL}")
    print(f"Tenant ID: {TENANT_ID}")
    print(f"Message data: {json.dumps(test_message, indent=2)}")
    
    headers = {
        'Content-Type': 'application/json',
        'X-Tenant-ID': TENANT_ID
    }
    
    try:
        response = requests.post(
            WEBHOOK_URL,
            headers=headers,
            json=test_message
        )
        
        print(f"\nResponse status code: {response.status_code}")
        print(f"Response headers: {dict(response.headers)}")
        
        try:
            print(f"Response body: {json.dumps(response.json(), indent=2)}")
        except:
            print(f"Response body: {response.text}")
        
        if response.status_code == 200:
            print("\n✅ Webhook test successful!")
        else:
            print("\n❌ Webhook test failed!")
        
    except Exception as e:
        print(f"\n❌ Error sending webhook: {str(e)}")

if __name__ == "__main__":
    # Check if tenant ID has been updated
    if TENANT_ID == "your_tenant_id_here":
        print("Please update the TENANT_ID variable in the script with your actual tenant ID.")
        print("Usage: python webhook_test.py [tenant_id]")
        
        # Check if tenant ID is provided as command line argument
        if len(sys.argv) > 1:
            TENANT_ID = sys.argv[1]
            test_message["tenant_id"] = TENANT_ID
            print(f"Using tenant ID from command line: {TENANT_ID}")
        else:
            sys.exit(1)
    
 