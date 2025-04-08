import React, { useState, useEffect } from 'react';
import { SearchOutlined, UserOutlined, TeamOutlined } from '@ant-design/icons';
import './chatList.css';

const ChatList = ({ activeChat, setActiveChat }) => {
  const [activeTab, setActiveTab] = useState('personal');
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [noApiConfigured, setNoApiConfigured] = useState(false);

  useEffect(() => {
    fetchConversations();
  }, []);

  // Update selectedChatId when activeChat changes from parent
  useEffect(() => {
    if (activeChat?.id && activeChat.id !== selectedChatId) {
      setSelectedChatId(activeChat.id);
      console.log('ChatList: Active chat updated to', activeChat.id);
    }
  }, [activeChat?.id, selectedChatId]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      setNoApiConfigured(false);
      
      // Get tenant ID from localStorage
      const tenantId = localStorage.getItem('tenant_id');
      const token = localStorage.getItem('token'); // Get authentication token
      
      console.log('[DEBUG] Using tenant ID from localStorage:', tenantId);
      console.log('[DEBUG] Using token from localStorage:', token ? 'Token exists' : 'No token found');
      
      // Make fetch call with Authorization header
      console.log('[DEBUG] Making fetch request to http://localhost:8000/api/conversations/');
      const response = await fetch('http://localhost:8000/api/conversations/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId, // Add tenant ID in header
          'Authorization': `Bearer ${token}` // Add auth token
        },
        body: JSON.stringify({
          tenant_id: tenantId // Also include in body
        })
      });
      
      console.log('[DEBUG] Response status:', response.status);
      const data = await response.json();
      console.log('[DEBUG] Response data:', data);

      if (!data.status || data.status === 'error') {
        // Check if the error is due to no API configuration
        if (data.error && data.error.includes('No WhatsApp API settings configured')) {
          setNoApiConfigured(true);
          setError('No WhatsApp API configured for this tenant');
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
        messages: []
      }));

      setChats(transformedChats);
      
      // Set the first chat as active if none is selected
      if (transformedChats.length > 0 && !selectedChatId) {
        const firstChat = transformedChats[0];
        setSelectedChatId(firstChat.id);
        setActiveChat(firstChat);
        console.log('ChatList: Setting first chat as active:', firstChat.id);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle chat selection
  const handleChatSelect = (chat) => {
    console.log('ChatList: Selected chat:', chat.id);
    
    // Only update if different chat is selected
    if (chat.id !== selectedChatId) {
      setSelectedChatId(chat.id);
      setActiveChat(chat);
    }
  };

  if (loading) {
    return <div className="chat-list-container">Loading conversations...</div>;
  }

  if (noApiConfigured) {
    return (
      <div className="chat-list-container no-api-configured">
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

  if (error) {
    return <div className="chat-list-container">Error: {error}</div>;
  }

  return (
    <div className="chat-list-container">
      <div className="chat-list-header">
        <h2>Chat</h2>
        <button className="search-button">
          <SearchOutlined className="search-icon" />
        </button>
      </div>

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
        {chats.map((chat) => (
          <div 
            key={chat.id} 
            className={`chat-item ${selectedChatId === chat.id ? 'active' : ''}`}
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
        ))}
      </div>

      <button className="new-chat-button">New chat</button>
    </div>
  );
};

export default ChatList;
