import React, { useState, useRef, useEffect } from 'react';
import { SendOutlined, MoreOutlined, InfoCircleOutlined, PictureOutlined } from '@ant-design/icons';
import './Chatbox.css';

const Chatbox = ({ activeChat, sendMessage, toggleDetailsDrawer }) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeChat?.id) {
      fetchMessages();
    }
  }, [activeChat?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      
      // Get tenant ID from localStorage
      const tenantId = localStorage.getItem('tenant_id');
      console.log('Using tenant ID for messages:', tenantId);
      
      const response = await fetch(`http://localhost:8000/api/messages/${activeChat.id}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId // Add tenant ID in header
        },
        body: JSON.stringify({
          tenant_id: tenantId // Also include in body
        })
      });
      
      const data = await response.json();

      if (!data.status || data.status === 'error') {
        throw new Error(data.errMsg || 'Failed to fetch messages');
      }

      // Transform messages data
      const transformedMessages = data.data
        .map(msg => ({
          id: msg.id,
          text: msg.value || '',
          sent: msg.is_message_by_contact !== 1,
          timestamp: new Date(msg.created_at),
          isImage: msg.message_type === 2,
          image: msg.message_type === 2 ? msg.header_image : null
        }))
        .sort((a, b) => a.timestamp - b.timestamp); // Sort messages by timestamp in ascending order

      setMessages(transformedMessages);
      setError(null);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError(err.message);
    } finally {
      setLoading(false);
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

      if (selectedImage) {
        // Send image message
        const formData = new FormData();
        formData.append('phone', activeChat.phone);
        formData.append('image', selectedImage);
        if (message.trim()) {
          formData.append('caption', message.trim());
        }

        response = await fetch('http://localhost:8000/api/messages/send-image/', {
          method: 'POST',
          body: formData
        });

        const data = await response.json();
        
        if (!data.status || data.status === 'error') {
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
        // Send text message
        if (!message.trim()) return;

        const messageData = {
          phone: activeChat.phone,
          message: message.trim()
        };

        response = await fetch('http://localhost:8000/api/messages/send/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(messageData)
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.status || data.status === 'error') {
          throw new Error(data.message || 'Failed to send message');
        }

        newMessage = {
          id: Date.now(),
          text: message.trim(),
          sent: true,
          timestamp: new Date()
        };
      }

      // Add new message to state immediately for better UX
      setMessages(prevMessages => [...prevMessages, newMessage]);
      setMessage('');
      setSelectedImage(null);
      setImagePreview(null);
    } catch (error) {
      console.error('Error sending message:', error);
      setError(error.message || 'Failed to send message');
      // Clear error after 3 seconds
      setTimeout(() => setError(null), 3000);
    } finally {
      setSending(false);
    }
  };

  if (!activeChat) {
    return <div className="no-chat-selected">Select a chat to start messaging</div>;
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
