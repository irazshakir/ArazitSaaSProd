import { useState, useEffect, useCallback } from 'react';

const useWebSocket = (channel) => {
  const [socket, setSocket] = useState(null);
  const [lastMessage, setLastMessage] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Initialize WebSocket connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    const tenantId = localStorage.getItem('tenant_id');
    
    if (!token || !tenantId) return;

    // Create WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Use Vite environment variable format (not Create React App format)
    const backendWsHost = import.meta.env.VITE_API_WS_HOST || 'api.arazit.com';
    const wsUrl = `${protocol}//${backendWsHost}/ws/${channel}/?token=${token}&tenant=${tenantId}`;
    
    console.log('useWebSocket: Connecting to', wsUrl);
    
    const ws = new WebSocket(wsUrl);

    // Connection opened
    ws.addEventListener('open', () => {
      setIsConnected(true);
      console.log('WebSocket Connected');
    });

    // Listen for messages
    ws.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        setLastMessage(data);
      } catch (error) {
        console.error('WebSocket message parse error:', error);
      }
    });

    // Handle connection close
    ws.addEventListener('close', () => {
      setIsConnected(false);
      console.log('WebSocket Disconnected');
      
      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        if (document.visibilityState === 'visible') {
          window.location.reload();
        }
      }, 5000);
    });

    // Handle errors
    ws.addEventListener('error', (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    });

    setSocket(ws);

    // Cleanup on unmount
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [channel]);

  // Send message through WebSocket
  const sendMessage = useCallback((data) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(data));
    }
  }, [socket]);

  return {
    isConnected,
    lastMessage,
    sendMessage
  };
};

export default useWebSocket; 