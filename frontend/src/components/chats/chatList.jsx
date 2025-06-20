import React, { useState, useEffect } from 'react';
import { SearchOutlined, UserOutlined, TeamOutlined } from '@ant-design/icons';
import { Typography, Box } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import './chatList.css';

const ChatList = ({ 
  activeChat, 
  setActiveChat, 
  refreshData, 
  lastRefreshTime, 
  hasNewChats, 
  noApiConfigured: parentNoApiConfigured,
  totalConversations,
  roleFilterActive,
  userRole,
  chats: parentChats
}) => {
  const [activeTab, setActiveTab] = useState('personal');
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [noApiConfigured, setNoApiConfigured] = useState(false);
  const prevChatsLength = React.useRef(0);
  const prevChatIds = React.useRef([]);

  // Update local chats when parent chats change
  useEffect(() => {
    if (parentChats && parentChats.length > 0) {
      setChats(parentChats);
      setLoading(false);
    }
  }, [parentChats]);

  // Update noApiConfigured state when parent prop changes
  useEffect(() => {
    if (parentNoApiConfigured) {
      setNoApiConfigured(true);
    }
  }, [parentNoApiConfigured]);

  // Initial load of conversations
  useEffect(() => {
    if (!parentChats || parentChats.length === 0) {
      fetchConversations();
    }
  }, []);

  // Refresh when lastRefreshTime changes
  useEffect(() => {
    if (lastRefreshTime && !parentChats) {
      fetchConversations(true);
    }
  }, [lastRefreshTime]);

  // Track changes in chat list
  useEffect(() => {
    if (chats.length > 0) {
      prevChatsLength.current = chats.length;
      prevChatIds.current = chats.map(chat => chat.id);
    }
  }, [chats]);

  // Update selectedChatId when activeChat changes from parent
  useEffect(() => {
    if (activeChat?.id && activeChat.id !== selectedChatId) {
      setSelectedChatId(activeChat.id);
    }
  }, [activeChat?.id, selectedChatId]);

  const fetchConversations = async (silentCheck = false) => {
    // If parent already indicates no API configured, don't make the API call
    if (parentNoApiConfigured) {
      setNoApiConfigured(true);
      setLoading(false);
      return;
    }
    
    try {
      if (!silentCheck) {
        setLoading(true);
      }
      
      setNoApiConfigured(false);
      
      const tenantId = localStorage.getItem('tenant_id');
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/conversations/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId,
          'Authorization': `Bearer ${token}`,
          'X-Request-Type': silentCheck ? 'background-check' : 'list-refresh'
        },
        body: JSON.stringify({
          tenant_id: tenantId,
          is_background_check: silentCheck
        })
      });
      
      // Check content type before trying to parse JSON
      const contentType = response.headers.get('content-type');
      if (contentType && !contentType.includes('application/json')) {
        // Got HTML instead of JSON, likely due to missing API configuration
        setNoApiConfigured(true);
        setError(null);
        setLoading(false);
        return;
      }
      
      const data = await response.json();

      if (!data.status || data.status === 'error') {
        if (data.error && data.error.includes('No WhatsApp API settings configured')) {
          setNoApiConfigured(true);
          setError(null);
          return;
        }
        throw new Error(data.errMsg || 'Failed to fetch conversations');
      }

      // Transform the conversations data to match our chat format
      const transformedChats = data.data.map(conv => ({
        id: conv.id,
        name: conv.name || conv.phone,
        phone: conv.phone,
        avatar: conv.avatar,
        lastMessage: conv.last_message || 'No messages yet',
        lastMessageTime: conv.last_reply_at ? new Date(conv.last_reply_at).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        }) : '',
        unread: !conv.resolved_chat && conv.is_last_message_by_contact === 1,
        isDirectlyAssigned: conv.is_assigned_to_user === true,
        messages: []
      }));

      setChats(transformedChats);
      
      // Set the first chat as active if none is selected
      if (transformedChats.length > 0 && !selectedChatId) {
        const firstChat = transformedChats[0];
        setSelectedChatId(firstChat.id);
        setActiveChat(firstChat);
      } else if (selectedChatId) {
        // If there's a selected chat, make sure it's updated
        const updatedSelectedChat = transformedChats.find(chat => chat.id === selectedChatId);
        if (updatedSelectedChat) {
          setActiveChat(updatedSelectedChat);
        }
      }
      
      setError(null);
    } catch (err) {
      if (!silentCheck) {
        // Check if it's a JSON parsing error (likely HTML response)
        if (err instanceof SyntaxError && err.message.includes('JSON')) {
          setNoApiConfigured(true);
          setError(null);
        } else {
          setError(err.message);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle chat selection
  const handleChatSelect = (chat) => {
    // Only update if different chat is selected
    if (chat.id !== selectedChatId) {
      setSelectedChatId(chat.id);
      setActiveChat(chat);
    }
  };

  // Format user role for display
  const formatUserRole = (role) => {
    if (!role) return '';
    return role.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading) {
    return <div className="chat-list-container">Loading conversations...</div>;
  }

  if (noApiConfigured) {
    return (
      <div className="chat-list-container no-api-configured">
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

  if (error && !noApiConfigured) {
    return <div className="chat-list-container">Error: {error}</div>;
  }

  return (
    <div className="chat-list-container">
      <div className="chat-list-header">
        <h2>Chat</h2>
        <div className="chat-list-actions">
          <button className="search-button">
            <SearchOutlined className="search-icon" />
          </button>
        </div>
      </div>

      {roleFilterActive && userRole && userRole !== 'admin' && (
        <div className="filter-banner">
          <Typography variant="caption" sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            fontSize: '11px',
            padding: '4px 8px',
            color: '#5f6368',
            backgroundColor: '#f8f9fa',
            borderRadius: '4px',
            marginBottom: '4px'
          }}>
            <span style={{ marginRight: '4px' }}>➤</span>
            Showing {chats.length} {chats.length === 1 ? 'conversation' : 'conversations'} assigned to you as {formatUserRole(userRole)}
            {totalConversations > 0 && chats.length !== totalConversations && (
              <span style={{ marginLeft: '4px' }}>
                (of {totalConversations} total)
              </span>
            )}
          </Typography>
        </div>
      )}

      <div className="chat-tabs">
        <button 
          className={`tab ${activeTab === 'personal' ? 'active' : ''}`}
          onClick={() => setActiveTab('personal')}
        >
          <UserOutlined className="user-icon" /> Personal
        </button>
        <button 
          className={`tab ${activeTab === 'groups' ? 'active' : ''}`}
          onClick={() => setActiveTab('groups')}
        >
          <TeamOutlined className="groups-icon" /> Groups
        </button>
      </div>

      <div className="chat-list">
        {chats.length > 0 ? (
          chats.map((chat) => (
            <div 
              key={chat.id} 
              className={`chat-item ${selectedChatId === chat.id ? 'active' : ''} ${chat.unread ? 'unread-chat' : ''}`}
              onClick={() => handleChatSelect(chat)}
            >
              <div className="avatar">
                <img 
                  src={chat.avatar || "/avatar-crm.svg"} 
                  alt={chat.name} 
                  className="avatar-image" 
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/avatar-crm.svg";
                  }}
                />
                {chat.isDirectlyAssigned && (
                  <div className="assignment-indicator" title="Directly assigned to you">•</div>
                )}
              </div>
              <div className="chat-info">
                <div className="chat-name-time">
                  <h3>{chat.name}</h3>
                  <span className="chat-time">{chat.lastMessageTime}</span>
                </div>
                <p className="chat-preview">{chat.lastMessage}</p>
              </div>
              {chat.unread && <div className="unread-indicator"></div>}
            </div>
          ))
        ) : (
          <div className="no-chats-message">
            {roleFilterActive && userRole && userRole !== 'admin' ? (
              <>
                <p>No chats are currently assigned to you.</p>
                <small>You'll see chats here when conversations are assigned to you directly or through leads.</small>
              </>
            ) : (
              <p>No chats available at this time.</p>
            )}
          </div>
        )}
      </div>

      <button className="new-chat-button">New chat</button>
    </div>
  );
};

export default ChatList;
