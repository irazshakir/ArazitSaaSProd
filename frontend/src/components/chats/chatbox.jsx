import React, { useState, useRef, useEffect } from 'react';
import { SendOutlined, MoreOutlined, InfoCircleOutlined, PictureOutlined, SyncOutlined } from '@ant-design/icons';
import './Chatbox.css';

const Chatbox = ({ activeChat, sendMessage, toggleDetailsDrawer, refreshData, lastRefreshTime }) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [noApiConfigured, setNoApiConfigured] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [currentChatId, setCurrentChatId] = useState(null);
  const lastProcessedRefreshTime = useRef(0);

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: smooth ? 'smooth' : 'auto' 
    });
  };

  useEffect(() => {
    if (activeChat?.id && activeChat.id !== currentChatId) {
      console.log('Chatbox: Active chat changed to', activeChat.id);
      setCurrentChatId(activeChat.id);
      setMessages([]);
      setError(null);
      setNoApiConfigured(false);
      setMessage('');
      setSelectedImage(null);
      setImagePreview(null);
      
      fetchMessages();
    }
  }, [activeChat?.id]);

  useEffect(() => {
    if (lastRefreshTime > lastProcessedRefreshTime.current && currentChatId) {
      console.log('ChatBox: Refresh triggered by lastRefreshTime update');
      lastProcessedRefreshTime.current = lastRefreshTime;
      fetchMessages(true);
    }
  }, [lastRefreshTime, currentChatId]);
  
  // Auto-scroll to newest messages
  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  // Store record of viewed messages
  useEffect(() => {
    if (messages.length > 0 && activeChat?.id) {
      // Get received messages (from contacts)
      const receivedMessages = messages.filter(m => !m.sent);
      
      if (receivedMessages.length > 0) {
        // Find latest received message timestamp
        const latestReceivedTime = Math.max(
          ...receivedMessages.map(m => m.timestamp.getTime())
        );
        
        // Store this timestamp as the last viewed time for this chat
        localStorage.setItem(
          `last_viewed_msg_time_${activeChat.id}`, 
          latestReceivedTime.toString()
        );
      }
    }
  }, [messages, activeChat?.id]);

  const fetchMessages = async (silentCheck = false) => {
    if (!activeChat?.id) return;
    
    try {
      if (!silentCheck) {
        setLoading(true);
      }
      
      setNoApiConfigured(false);
      setRefreshing(true);
      
      const tenantId = localStorage.getItem('tenant_id');
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:8000/api/messages/${activeChat.id}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId,
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          tenant_id: tenantId
        })
      });
      
      const data = await response.json();

      if (!data.status || data.status === 'error') {
        if (data.error && data.error.includes('No WhatsApp API settings configured')) {
          setNoApiConfigured(true);
          setError('No WhatsApp API configured for this tenant');
          return;
        }
        throw new Error(data.errMsg || 'Failed to fetch messages');
      }

      const transformedMessages = data.data
        .map(msg => ({
          id: msg.id,
          text: msg.value || '',
          sent: msg.is_message_by_contact !== 1,
          timestamp: new Date(msg.created_at),
          isImage: msg.message_type === 2,
          image: msg.message_type === 2 ? msg.header_image : null
        }))
        .sort((a, b) => a.timestamp - b.timestamp);

      // Check if the message list has changed
      const messagesChanged = messages.length !== transformedMessages.length || 
        JSON.stringify(messages.map(m => m.id)) !== JSON.stringify(transformedMessages.map(m => m.id));
      
      if (messagesChanged) {
        console.log('ChatBox: Messages have changed, updating state');
        setMessages(transformedMessages);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!activeChat?.phone && !activeChat?.id) return;

    setSending(true);
    try {
      let response;
      let newMessage;
      
      const tenantId = localStorage.getItem('tenant_id');
      const token = localStorage.getItem('token');
      
      console.log('[DEBUG] Using tenant ID from localStorage:', tenantId);
      console.log('[DEBUG] Using token from localStorage:', token ? 'Token exists' : 'No token found');

      if (selectedImage) {
        const formData = new FormData();
        formData.append('phone', activeChat.phone);
        formData.append('image', selectedImage);
        if (message.trim()) {
          formData.append('caption', message.trim());
        }

        response = await fetch('http://localhost:8000/api/messages/send-image/', {
          method: 'POST',
          headers: {
            'X-Tenant-ID': tenantId,
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        if (!response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('text/html')) {
            throw new Error(`Server error: ${response.status} ${response.statusText}`);
          }
          
          try {
            const errorData = await response.json();
            if (errorData.error && errorData.error.includes('No WhatsApp API settings configured')) {
              setNoApiConfigured(true);
              setError('No WhatsApp API configured for this tenant');
              return;
            }
            throw new Error(errorData.error || errorData.errMsg || 'Failed to send image');
          } catch (jsonError) {
            throw new Error(`Server error: ${response.status} ${response.statusText}`);
          }
        }

        const data = await response.json();
        
        if (!data.status || data.status === 'error') {
          if (data.error && data.error.includes('No WhatsApp API settings configured')) {
            setNoApiConfigured(true);
            setError('No WhatsApp API configured for this tenant');
            return;
          }
          throw new Error(data.message || 'Failed to send image');
        }

        newMessage = {
          id: Date.now(),
          text: message.trim() || 'Image',
          sent: true,
          timestamp: new Date(),
          image: imagePreview,
          isImage: true
        };
      } else {
        if (!message.trim()) return;

        const messageData = {
          phone: activeChat.phone,
          message: message.trim()
        };

        response = await fetch('http://localhost:8000/api/messages/send/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Tenant-ID': tenantId,
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(messageData)
        });

        if (!response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('text/html')) {
            throw new Error(`Server error: ${response.status} ${response.statusText}`);
          }
          
          try {
            const errorData = await response.json();
            if (errorData.error && errorData.error.includes('No WhatsApp API settings configured')) {
              setNoApiConfigured(true);
              setError('No WhatsApp API configured for this tenant');
              return;
            }
            throw new Error(errorData.error || errorData.errMsg || 'Failed to send message');
          } catch (jsonError) {
            throw new Error(`Server error: ${response.status} ${response.statusText}`);
          }
        }

        const data = await response.json();
        
        if (!data.status || data.status === 'error') {
          if (data.error && data.error.includes('No WhatsApp API settings configured')) {
            setNoApiConfigured(true);
            setError('No WhatsApp API configured for this tenant');
            return;
          }
          throw new Error(data.message || 'Failed to send message');
        }

        newMessage = {
          id: Date.now(),
          text: message.trim(),
          sent: true,
          timestamp: new Date()
        };
      }

      setMessages(prevMessages => [...prevMessages, newMessage]);
      setMessage('');
      setSelectedImage(null);
      setImagePreview(null);
      
      if (refreshData) {
        setTimeout(() => refreshData(), 1000);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError(error.message || 'Failed to send message');
      setTimeout(() => setError(null), 3000);
    } finally {
      setSending(false);
    }
  };

  const handleManualRefresh = () => {
    fetchMessages();
  };

  if (!activeChat) {
    return <div className="no-chat-selected">Select a chat to start messaging</div>;
  }

  if (noApiConfigured) {
    return (
      <div className="chatbox-container no-api-configured">
        <div className="chatbox-header">
          <div className="chat-user-info">
            <div className="avatar">
              <img 
                src={activeChat.avatar || "/avatar-crm.svg"} 
                alt={activeChat.name} 
                className="avatar-image" 
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/avatar-crm.svg";
                }}
              />
            </div>
            <div>
              <h3>{activeChat.name}</h3>
              <p className="last-seen">last seen recently</p>
            </div>
          </div>
          <div className="chat-header-actions">
            <button 
              className="refresh-button"
              onClick={handleManualRefresh}
              disabled={refreshing}
              title="Refresh messages"
            >
              <SyncOutlined spin={refreshing} />
            </button>
            <button 
              className="info-button" 
              onClick={toggleDetailsDrawer}
              title="View Details"
            >
              <InfoCircleOutlined />
            </button>
            <button className="more-options">
              <MoreOutlined />
            </button>
          </div>
        </div>

        <div className="no-api-message">
          <h3>No WhatsApp API Configured</h3>
          <p>Please configure your WhatsApp API settings to start using the chat feature.</p>
          <button className="configure-button" onClick={() => window.location.href = '/settings'}>
            Configure Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="chatbox-container">
      <div className="chatbox-header">
        <div className="chat-user-info">
          <div className="avatar">
            <img 
              src={activeChat.avatar || "/avatar-crm.svg"} 
              alt={activeChat.name} 
              className="avatar-image" 
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/avatar-crm.svg";
              }}
            />
          </div>
          <div>
            <h3>{activeChat.name}</h3>
            <p className="last-seen">last seen recently</p>
          </div>
        </div>
        <div className="chat-header-actions">
          <button 
            className="refresh-button"
            onClick={handleManualRefresh}
            disabled={refreshing}
            title="Refresh messages"
          >
            <SyncOutlined spin={refreshing} />
          </button>
          <button 
            className="info-button" 
            onClick={toggleDetailsDrawer}
            title="View Details"
          >
            <InfoCircleOutlined />
          </button>
          <button className="more-options">
            <MoreOutlined />
          </button>
        </div>
      </div>

      <div className="messages-container">
        {loading ? (
          <div className="loading-messages">Loading messages...</div>
        ) : error ? (
          <div className="error-messages">Error: {error}</div>
        ) : (
          <>
            {messages.map((msg, index) => (
              <div 
                key={msg.id || index} 
                className={`message ${msg.sent ? 'sent' : 'received'}`}
              >
                {!msg.sent && (
                  <div className="message-avatar">
                    <img 
                      src={activeChat.avatar || "/avatar-crm.svg"} 
                      alt={activeChat.name} 
                      className="avatar-image" 
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/avatar-crm.svg";
                      }}
                    />
                  </div>
                )}
                <div className="message-content">
                  {msg.isImage ? (
                    <div className="image-message">
                      <img src={msg.image} alt="Shared" className="shared-image" />
                      {msg.text !== 'Image' && <p>{msg.text}</p>}
                    </div>
                  ) : (
                    <p>{msg.text}</p>
                  )}
                  <span className="message-time">
                    {msg.timestamp.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <form className="message-input-container" onSubmit={handleSendMessage}>
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleImageSelect}
          style={{ display: 'none' }}
        />
        <button
          type="button"
          className="image-button"
          onClick={() => fileInputRef.current?.click()}
          disabled={sending}
        >
          <PictureOutlined />
        </button>
        <input
          type="text"
          placeholder={selectedImage ? "Add a caption (optional)" : "Enter a message"}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="message-input"
          disabled={sending}
        />
        <button 
          type="submit" 
          className="send-button"
          disabled={sending || (!message.trim() && !selectedImage)}
        >
          <SendOutlined className="send-icon" />
        </button>
      </form>
      {imagePreview && (
        <div className="image-preview">
          <img src={imagePreview} alt="Preview" />
          <button 
            className="remove-image"
            onClick={() => {
              setSelectedImage(null);
              setImagePreview(null);
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default Chatbox;
