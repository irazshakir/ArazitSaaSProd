import React, { useState, useRef, useEffect } from 'react';
import { SendOutlined, MoreOutlined, InfoCircleOutlined, PictureOutlined, SyncOutlined, UserSwitchOutlined } from '@ant-design/icons';
import './chatbox.css';

// Force-applied styles to fix message bubbles
const forceStyles = `
.message.received {
  align-self: flex-start !important;
  justify-content: flex-start !important;
}
.message.sent {
  align-self: flex-end !important;
  justify-content: flex-end !important;
}
.message.received .message-content {
  background-color: #fff !important;
  border-radius: 0 16px 16px 16px !important;
}
.message.sent .message-content {
  background-color: #25D366 !important;
  color: white !important;
  border-radius: 16px 0 16px 16px !important;
}
.message.received .message-content:before {
  left: -8px !important;
  right: auto !important;
  border-radius: 0 0 0 16px !important;
  background-color: #fff !important;
}
.message.sent .message-content:before {
  right: -8px !important;
  left: auto !important;
  border-radius: 0 0 16px 0 !important;
  background-color: #25D366 !important;
}
.message-avatar {
  margin-right: 8px !important;
}
`;

const Chatbox = ({ activeChat, sendMessage, toggleDetailsDrawer, refreshData, lastRefreshTime, noApiConfigured: parentNoApiConfigured, userRole }) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [noApiConfigured, setNoApiConfigured] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [noPermission, setNoPermission] = useState(false);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [assigningUser, setAssigningUser] = useState(false);
  const [assignmentSuccess, setAssignmentSuccess] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const userDropdownRef = useRef(null);
  const [currentChatId, setCurrentChatId] = useState(null);
  const lastProcessedRefreshTime = useRef(0);

  // Update noApiConfigured state when parent prop changes
  useEffect(() => {
    if (parentNoApiConfigured) {
      setNoApiConfigured(true);
    }
  }, [parentNoApiConfigured]);

  // Add event listener to handle clicks outside the dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: smooth ? 'smooth' : 'auto' 
    });
  };

  // Remove auto-refresh effect
  useEffect(() => {
    if (activeChat?.id && activeChat.id !== currentChatId) {
      setCurrentChatId(activeChat.id);
      setMessages([]);
      setError(null);
      setMessage('');
      setSelectedImage(null);
      setImagePreview(null);
      
      // Only fetch messages if API is configured
      if (!parentNoApiConfigured) {
        setNoApiConfigured(false);
        fetchMessages();
      }
    }
  }, [activeChat?.id, parentNoApiConfigured]);

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

  // Fetch users for assignment dropdown
  const fetchUsers = async () => {
    if (loadingUsers) return;

    try {
      setLoadingUsers(true);
      
      const tenantId = localStorage.getItem('tenant_id');
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:8000/api/users-for-assignment/?tenant_id=${tenantId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId,
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      
      if (data.status === 'success') {
        setUsers(data.data);
      } else {
        throw new Error(data.errMsg || 'Failed to fetch users');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Handle user assignment
  const assignChatToUser = async (userId) => {
    if (!activeChat?.id || assigningUser) return;
    
    try {
      setAssigningUser(true);
      setAssignmentSuccess(null);
      
      const tenantId = localStorage.getItem('tenant_id');
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:8000/api/assign-chat/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId,
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          tenant_id: tenantId,
          chat_id: activeChat.id,
          user_id: userId,
          phone: activeChat.phone || '',
          name: activeChat.name || ''
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to assign chat');
      }
      
      const data = await response.json();
      
      if (data.status === 'success') {
        setAssignmentSuccess({
          success: true,
          message: data.data.message
        });
        
        // Hide success message after 3 seconds
        setTimeout(() => {
          setAssignmentSuccess(null);
        }, 3000);
        
        // Refresh chats to show updated assignment
        if (refreshData) {
          setTimeout(() => refreshData(), 1000);
        }
      } else {
        throw new Error(data.errMsg || 'Failed to assign chat');
      }
    } catch (err) {
      setAssignmentSuccess({
        success: false,
        message: err.message || 'Failed to assign chat'
      });
      
      // Hide error message after 3 seconds
      setTimeout(() => {
        setAssignmentSuccess(null);
      }, 3000);
    } finally {
      setAssigningUser(false);
      setShowUserDropdown(false);
    }
  };

  const fetchMessages = async (silentCheck = false) => {
    if (!activeChat?.id) return;
    
    try {
      if (!silentCheck) {
        setLoading(true);
      }
      
      setNoApiConfigured(false);
      setRefreshing(true);
      setNoPermission(false);
      
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
      
      // Check status code for permission issues
      if (response.status === 403) {
        setNoPermission(true);
        setError(null);
        setMessages([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      // Check content type before trying to parse JSON
      const contentType = response.headers.get('content-type');
      if (contentType && !contentType.includes('application/json')) {
        // Got HTML instead of JSON, likely due to missing API configuration
        setNoApiConfigured(true);
        setError(null);
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      const data = await response.json();

      if (!data.status || data.status === 'error') {
        if (data.error && data.error.includes('No WhatsApp API settings configured')) {
          setNoApiConfigured(true);
          setError(null);
          return;
        }
        
        // Check for permission error
        if (data.error && data.error.toLowerCase().includes('permission')) {
          setNoPermission(true);
          setError(null);
          setMessages([]);
          return;
        }
        
        throw new Error(data.errMsg || 'Failed to fetch messages');
      }

      const transformedMessages = data.data
        .map(msg => {
          // Determine if message is from contact
          const isFromContact = msg.is_message_by_contact === 1 || msg.is_message_by_contact === true;
          
          // Create the message object with the corrected classification
          const messageObj = {
            id: msg.id,
            text: msg.value || '',
            // For display, sent=true means OUR message (displayed on right)
            // sent=false means THEIR message (displayed on left)
            sent: !isFromContact,
            timestamp: new Date(msg.created_at),
            isImage: msg.message_type === 2,
            image: msg.message_type === 2 ? msg.header_image : null
          };
          
          return messageObj;
        })
        .sort((a, b) => a.timestamp - b.timestamp);

      // Check if the message list has changed
      const messagesChanged = messages.length !== transformedMessages.length || 
        JSON.stringify(messages.map(m => m.id)) !== JSON.stringify(transformedMessages.map(m => m.id));
      
      if (messagesChanged) {
        setMessages(transformedMessages);
      }
      
      setError(null);
    } catch (err) {
      // Check if it's a JSON parsing error (likely HTML response)
      if (err instanceof SyntaxError && err.message.includes('JSON')) {
        setNoApiConfigured(true);
        setError(null);
      } else {
        setError(err.message);
      }
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
              setError(null);
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
            setError(null);
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
              setError(null);
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
            setError(null);
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

  if (noPermission) {
    return (
      <div className="chatbox-container no-permission">
        <style>{forceStyles}</style>
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
              <p className="last-seen">Chat details restricted</p>
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
          </div>
        </div>

        <div className="no-permission-message">
          <div className="no-permission-icon">
            <svg viewBox="0 0 24 24" width="64" height="64" fill="#6c757d">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 11h6c-.54 4.13-3.77 7.61-6 8.77V12H6V6.3l6-2.7v8.4z"/>
            </svg>
          </div>
          <h3>Access Restricted</h3>
          <p>You don't have permission to view this chat. This chat is assigned to another user or team.</p>
        </div>
      </div>
    );
  }

  if (noApiConfigured) {
    return (
      <div className="chatbox-container no-api-configured">
        <style>{forceStyles}</style>
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
          <div className="no-api-icon">
            <svg viewBox="0 0 24 24" width="64" height="64" fill="#25D366">
              <path d="M17.498 14.382c-.301-.15-1.767-.867-2.04-.966-.273-.101-.473-.15-.673.15-.197.295-.771.964-.944 1.162-.175.195-.349.21-.646.075-.3-.15-1.263-.465-2.403-1.485-.888-.795-1.484-1.77-1.66-2.07-.174-.3-.019-.465.13-.615.136-.135.301-.345.451-.523.146-.181.194-.301.297-.496.1-.21.049-.375-.025-.524-.075-.15-.672-1.62-.922-2.206-.24-.584-.487-.51-.672-.51-.172-.015-.371-.015-.571-.015-.2 0-.523.074-.797.359-.273.3-1.045 1.02-1.045 2.475s1.07 2.865 1.219 3.075c.149.195 2.105 3.195 5.1 4.485.714.3 1.27.48 1.704.629.714.227 1.365.195 1.88.121.574-.091 1.767-.721 2.016-1.426.255-.705.255-1.29.18-1.425-.074-.135-.27-.21-.57-.345m-5.446 7.443h-.016c-1.77 0-3.524-.48-5.055-1.38l-.36-.214-3.75.975 1.005-3.645-.239-.375c-.99-1.576-1.516-3.391-1.516-5.26 0-5.445 4.455-9.885 9.942-9.885 2.654 0 5.145 1.035 7.021 2.91 1.875 1.859 2.909 4.35 2.909 6.99-.004 5.444-4.46 9.885-9.935 9.885M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.334.101 11.893c0 2.096.549 4.14 1.595 5.945L0 24l6.335-1.652c1.746.943 3.71 1.444 5.71 1.447h.006c6.585 0 11.946-5.336 11.949-11.896 0-3.176-1.24-6.165-3.495-8.411"/>
            </svg>
          </div>
          <h3>WhatsApp API Not Configured</h3>
          <p>You need to configure your WhatsApp Business API settings before you can use this feature. Configure it now to start engaging with your customers via WhatsApp.</p>
          <button 
            className="configure-button" 
            onClick={() => window.location.href = '/settings/waba-settings'}
          >
            Configure WhatsApp API
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="chatbox-container">
      <style>{forceStyles}</style>
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
          {assignmentSuccess && (
            <div className={`assignment-notification ${assignmentSuccess.success ? 'success' : 'error'}`}>
              {assignmentSuccess.message}
            </div>
          )}
          <div className="user-assignment-dropdown" ref={userDropdownRef}>
            <button 
              className="assign-button"
              onClick={() => {
                if (!showUserDropdown) {
                  fetchUsers();
                }
                setShowUserDropdown(!showUserDropdown);
              }}
              title="Assign Chat"
            >
              <UserSwitchOutlined />
            </button>
            {showUserDropdown && (
              <div className="user-dropdown">
                <div className="dropdown-header">
                  Assign chat to:
                </div>
                {loadingUsers ? (
                  <div className="dropdown-loading">Loading users...</div>
                ) : users.length > 0 ? (
                  <ul className="user-list">
                    {users.map(user => (
                      <li 
                        key={user.id} 
                        onClick={() => assignChatToUser(user.id)}
                        className={assigningUser ? 'disabled' : ''}
                      >
                        <span className="user-name">{user.name}</span>
                        <span className="user-role">{user.role}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="no-users">No users found</div>
                )}
              </div>
            )}
          </div>
          <button 
            className="refresh-button"
            onClick={handleManualRefresh}
            disabled={refreshing}
            title="Refresh messages"
          >
            <SyncOutlined spin={refreshing} />
          </button>
          <button className="more-options">
            <MoreOutlined />
          </button>
        </div>
      </div>

      <div className="messages-container" style={{ display: 'flex', flexDirection: 'column' }}>
        {loading ? (
          <div className="loading-messages">Loading messages...</div>
        ) : error && !noApiConfigured ? (
          <div className="error-messages">Error: {error}</div>
        ) : (
          <>
            {messages.map((msg, index) => {
              // For WhatsApp-style chat, messages FROM contact should appear on LEFT with white background
              // Messages TO contact (sent by user) should appear on RIGHT with green background
              
              // Use the final determined property
              const isSentByUser = msg.sent;
              
              // Force display of messages correctly with style overrides
              const containerStyle = {
                display: 'flex',
                marginBottom: '16px',
                maxWidth: '65%',
                position: 'relative',
                alignSelf: isSentByUser ? 'flex-end' : 'flex-start',
                justifyContent: isSentByUser ? 'flex-end' : 'flex-start'
              };
              
              const bubbleStyle = {
                padding: '10px 16px',
                borderRadius: isSentByUser ? '16px 0 16px 16px' : '0 16px 16px 16px',
                position: 'relative',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                backgroundColor: isSentByUser ? '#25D366' : '#fff',
                color: isSentByUser ? 'white' : '#333',
              };
              
              const timeStyle = {
                fontSize: '11px',
                color: isSentByUser ? 'rgba(255, 255, 255, 0.8)' : '#999',
                display: 'block',
                marginTop: '4px',
                textAlign: 'right'
              };
              
              return (
                <div 
                  key={msg.id || index} 
                  style={containerStyle}
                  className={`message ${isSentByUser ? 'sent' : 'received'}`}
                >
                  {!isSentByUser && (
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
                  <div 
                    className="message-content"
                    style={bubbleStyle}
                  >
                    {msg.isImage ? (
                      <div className="image-message">
                        <img src={msg.image} alt="Shared" className="shared-image" />
                        {msg.text !== 'Image' && <p>{msg.text}</p>}
                      </div>
                    ) : (
                      <p>{msg.text}</p>
                    )}
                    <span 
                      className="message-time"
                      style={timeStyle}
                    >
                      {msg.timestamp.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                </div>
              );
            })}
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
