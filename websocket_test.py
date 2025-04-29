#!/usr/bin/env python
import websocket
import json
import time
import threading
import sys

# Configuration - update with your values
WS_URL = "ws://api.arazit.com/ws/whatsapp/?token={token}&tenant={tenant_id}"
TOKEN = "4Qmz+XPsZc16r/iwmAJpmvo2DAYqWmLdSVhQu7MPYTrR3o+wVfh7DT8rEKfQCBFb/p/QombJ1NDgzHevp8cnCw=="  # JWT token
TENANT_ID = "ce781194-477e-4cb0-bf67-b438b735b81b"

# Global to track connection status
connected = False

def on_message(ws, message):
    """Handle received messages"""
    print("\n📩 Message received:")
    try:
        data = json.loads(message)
        print(json.dumps(data, indent=2))
    except:
        print(message)

def on_error(ws, error):
    """Handle errors"""
    print(f"\n❌ Error: {error}")

def on_close(ws, close_status_code, close_msg):
    """Handle connection close"""
    global connected
    connected = False
    print(f"\n🔌 Connection closed: {close_status_code} - {close_msg}")

def on_open(ws):
    """Handle connection open"""
    global connected
    connected = True
    print("\n✅ Connection established!")
    
    # Send a test ping
    ping_data = {
        "type": "ping",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
    }
    ws.send(json.dumps(ping_data))
    print(f"\n📤 Sent: {json.dumps(ping_data)}")

def heartbeat_thread(ws):
    """Send periodic heartbeat to keep connection alive"""
    while connected:
        if connected:  # Check again in case connection was lost
            try:
                heartbeat_data = {
                    "type": "heartbeat",
                    "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
                }
                ws.send(json.dumps(heartbeat_data))
                print(f"\n💓 Heartbeat sent: {time.strftime('%H:%M:%S')}")
            except:
                print("\n❌ Failed to send heartbeat")
        time.sleep(30)  # Send heartbeat every 30 seconds

def main():
    # Check if credentials have been updated
    global TOKEN, TENANT_ID
    
    if TOKEN == "your_token_here" or TENANT_ID == "your_tenant_id_here":
        print("Please update the TOKEN and TENANT_ID variables in the script.")
        print("Usage: python websocket_test.py [token] [tenant_id]")
        
        # Check if credentials are provided as command line arguments
        if len(sys.argv) > 2:
            TOKEN = sys.argv[1]
            TENANT_ID = sys.argv[2]
            print(f"Using credentials from command line")
        else:
            sys.exit(1)
    
    # Format the WebSocket URL with actual values
    ws_url = WS_URL.format(token=TOKEN, tenant_id=TENANT_ID)
    
    print("\n" + "="*50)
    print("WEBSOCKET TEST")
    print("="*50)
    print(f"\nConnecting to: {ws_url}")
    
    # Enable trace for detailed logging
    websocket.enableTrace(True)
    
    # Create WebSocket connection
    ws = websocket.WebSocketApp(
        ws_url,
        on_open=on_open,
        on_message=on_message,
        on_error=on_error,
        on_close=on_close
    )
    
    # Start heartbeat thread
    threading.Thread(target=heartbeat_thread, args=(ws,), daemon=True).start()
    
    # Connect to WebSocket server
    ws.run_forever()

if __name__ == "__main__":
    main() 