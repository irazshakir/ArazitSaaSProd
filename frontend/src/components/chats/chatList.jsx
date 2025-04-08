import React, { useState, useEffect } from 'react';
import { SearchOutlined, UserOutlined, TeamOutlined, SyncOutlined } from '@ant-design/icons';
import './chatList.css';

const ChatList = ({ activeChat, setActiveChat, refreshData, lastRefreshTime, hasNewChats }) => {
  const [activeTab, setActiveTab] = useState('personal');
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [noApiConfigured, setNoApiConfigured] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const lastProcessedRefreshTime = React.useRef(0);
  const prevChatsLength = React.useRef(0);
  const prevChatIds = React.useRef([]);

  // Initial load of conversations
  useEffect(() => {
    fetchConversations();
  }, []);

  // Track changes in chat list
  useEffect(() => {
    if (chats.length > 0) {
      prevChatsLength.current = chats.length;
      prevChatIds.current = chats.map(chat => chat.id);
    }
  }, [chats]);

  // Effect for refresh trigger
  useEffect(() => {
    // Only refresh if the refresh time has changed and is newer than the last processed time
    if (lastRefreshTime && lastRefreshTime > lastProcessedRefreshTime.current) {
      console.log('ChatList: Refresh triggered by lastRefreshTime update');
      lastProcessedRefreshTime.current = lastRefreshTime;
      fetchConversations(true);
    }
  }, [lastRefreshTime]);

  // Update selectedChatId when activeChat changes from parent
  useEffect(() => {
    if (activeChat?.id && activeChat.id !== selectedChatId) {
      setSelectedChatId(activeChat.id);
      console.log('ChatList: Active chat updated to', activeChat.id);
    }
  }, [activeChat?.id, selectedChatId]);

  const fetchConversations = async (silentCheck = false) => {
    try {
      if (!silentCheck) {
        setLoading(true);
      }
      
      setRefreshing(true);
      setNoApiConfigured(false);
      
      const tenantId = localStorage.getItem('tenant_id');
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:8000/api/conversations/', {
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

      // Check if the list of chats has changed
      const hasChanges = hasChatsChanged(transformedChats);
      
      if (hasChanges || !silentCheck) {
        setChats(transformedChats);
        
        // Set the first chat as active if none is selected
        if (transformedChats.length > 0 && !selectedChatId) {
          const firstChat = transformedChats[0];
          setSelectedChatId(firstChat.id);
          setActiveChat(firstChat);
          console.log('ChatList: Setting first chat as active:', firstChat.id);
        } else if (selectedChatId) {
          // If there's a selected chat, make sure it's updated
          const updatedSelectedChat = transformedChats.find(chat => chat.id === selectedChatId);
          if (updatedSelectedChat) {
            setActiveChat(updatedSelectedChat);
          }
        }
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      if (!silentCheck) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Compare chats to detect changes
  const hasChatsChanged = (newChats) => {
    // First check if number of chats changed
    if (newChats.length !== prevChatsLength.current) {
      return true;
    }
    
    // Then check if the list of IDs has changed
    const newChatIds = newChats.map(chat => chat.id);
    if (JSON.stringify(newChatIds) !== JSON.stringify(prevChatIds.current)) {
      return true;
    }
    
    // Finally check for changes in unread status or last message
    for (const newChat of newChats) {
      const prevChat = chats.find(c => c.id === newChat.id);
      if (prevChat) {
        if (prevChat.unread !== newChat.unread || 
            prevChat.lastMessage !== newChat.lastMessage) {
          return true;
        }
      }
    }
    
    return false;
  };

  // Handle manual refresh - pass through to parent
  const handleManualRefresh = () => {
    if (refreshData) {
      refreshData();
    } else {
      fetchConversations();
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

  if (loading && !refreshing) {
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

  if (error && !refreshing) {
    return <div className="chat-list-container">Error: {error}</div>;
  }

  return (
    <div className="chat-list-container">
      <div className="chat-list-header">
        <h2>Chat</h2>
        <div className="chat-list-actions">
          <button 
            className={`refresh-button ${refreshing ? 'refreshing' : ''} ${hasNewChats ? 'has-new' : ''}`}
            onClick={handleManualRefresh}
            disabled={refreshing}
          >
            <SyncOutlined spin={refreshing} />
          </button>
          <button className="search-button">
            <SearchOutlined className="search-icon" />
          </button>
        </div>
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
