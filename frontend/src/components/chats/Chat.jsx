import React, { useState, useEffect, useRef } from 'react';
import ChatList from './chatList';
import Chatbox from './chatbox';
import ChatDetails from './chatDetails';
import TemplateList from './TemplateList';
import GroupList from './GroupList';
import ContactList from './ContactList';
import { Box, Paper, Tabs, Tab, IconButton, Tooltip } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import './Chat.css';

// Dummy data - replace with your API calls later
const dummyChats = [
  {
    id: 1,
    name: 'Shannon Baker',
    avatar: '/avatars/shannon.jpg',
    lastMessage: 'Will do. Appreciate it!',
    lastMessageTime: '09:39 AM',
    unread: false,
    messages: [
      { id: 1, text: "be too much to handle.", sent: true },
      { id: 2, text: "I think you should go for it. You're more than capable and it sounds like a great opportunity for growth.", sent: false },
      { id: 3, text: "Thanks, Mark. I needed that encouragement. I'll start working on my application tonight.", sent: true },
      { id: 4, text: "Anytime! Let me know if you need any help with your resume or cover letter.", sent: false },
      { id: 5, text: "Will do. Appreciate it!", sent: true }
    ],
    leadDetails: {
      name: 'Shannon Baker',
      phone: '+1 555-123-4567',
      email: 'shannon.baker@example.com'
    },
    productDetails: {
      name: 'Premium CRM Package',
      price: '$299/month'
    },
    assignedTo: {
      name: 'Mark Johnson',
      id: 101
    },
    status: 'Interested'
  },
  {
    id: 2,
    name: 'Jessica Wells',
    avatar: '/avatars/jessica.jpg',
    lastMessage: "Perfect. I'll pack everything up.",
    lastMessageTime: '07:39 PM',
    unread: true,
    messages: [
      // Sample messages
      { id: 1, text: "Hi Jessica, how's your order coming along?", sent: false },
      { id: 2, text: "Perfect. I'll pack everything up.", sent: true }
    ]
  },
  {
    id: 3,
    name: 'Arlene Pierce',
    avatar: '/avatars/arlene.jpg',
    lastMessage: 'Okay, Thanks 🍓',
    lastMessageTime: '05:49 PM',
    unread: false,
    messages: [
      // Sample messages
      { id: 1, text: "Your appointment is confirmed for Thursday at 2 PM.", sent: false },
      { id: 2, text: "Okay, Thanks 🍓", sent: true }
    ]
  },
  {
    id: 4,
    name: 'Max Alexander',
    avatar: '/avatars/max.jpg',
    lastMessage: "I'd love that! Let's discuss...",
    lastMessageTime: '03:59 PM',
    unread: false,
    messages: [
      // Sample messages
      { id: 1, text: "Would you be interested in our premium package?", sent: false },
      { id: 2, text: "I'd love that! Let's discuss...", sent: true }
    ]
  },
  {
    id: 5,
    name: 'Jeremiah Minsk',
    avatar: '/avatars/jeremiah.jpg',
    lastMessage: 'No problem. Got it!',
    lastMessageTime: '04:59 AM',
    unread: false,
    messages: [
      // Sample messages
      { id: 1, text: "Please submit your documents by Friday.", sent: false },
      { id: 2, text: "No problem. Got it!", sent: true }
    ]
  },
  {
    id: 6,
    name: 'Camila Simmmons',
    avatar: '/avatars/camila.jpg',
    lastMessage: "True! I'll be more careful...",
    lastMessageTime: '12:19 AM',
    unread: false,
    messages: [
      // Sample messages
      { id: 1, text: "Remember to verify all client information.", sent: false },
      { id: 2, text: "True! I'll be more careful...", sent: true }
    ]
  },
];

const Chat = () => {
  const [chats, setChats] = useState(dummyChats);
  const [activeChat, setActiveChat] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [detailsKey, setDetailsKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(Date.now());
  const [hasNewChats, setHasNewChats] = useState(false);
  const lastActiveChat = useRef(null);

  // Set the polling interval (in milliseconds) - 30 seconds is less intrusive
  const POLLING_INTERVAL = 30000; // 30 seconds

  useEffect(() => {
    // Set first chat as active on initial load
    if (chats.length > 0 && !activeChat) {
      setActiveChat(chats[0]);
    }
  }, [chats]);

  // When active chat changes, increment details key to force re-render
  useEffect(() => {
    if (activeChat) {
      setDetailsKey(prevKey => prevKey + 1);
      // Store the active chat ID for comparison
      lastActiveChat.current = activeChat.id;
    }
  }, [activeChat?.id]);

  // Document visibility API to check if tab is active
  useEffect(() => {
    let visibilityInterval;
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // When tab becomes visible, do an immediate refresh
        if (activeTab === 0 && !isRefreshing) {
          refreshData(true);
        }
        
        // Then set up the interval
        visibilityInterval = setInterval(() => {
          if (!isRefreshing && activeTab === 0) {
            refreshData(false);
          }
        }, POLLING_INTERVAL);
      } else {
        // Clear interval when tab becomes hidden
        clearInterval(visibilityInterval);
      }
    };
    
    // Set initial interval if document is visible
    if (document.visibilityState === 'visible') {
      visibilityInterval = setInterval(() => {
        if (!isRefreshing && activeTab === 0) {
          refreshData(false);
        }
      }, POLLING_INTERVAL);
    }
    
    // Add event listener for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Clean up
    return () => {
      clearInterval(visibilityInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isRefreshing, activeTab]);

  // Function to refresh the chat data with silent option
  const refreshData = async (forceFull = false) => {
    console.log('Checking for new chats/messages...');
    setIsRefreshing(true);
    
    try {
      // Get tenant ID and token from localStorage
      const tenantId = localStorage.getItem('tenant_id');
      const token = localStorage.getItem('token');
      
      // Fetch conversations
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
      
      if (data.status === 'success') {
        // Transform the conversations data
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
        
        // Check if there are new chats or updates to existing chats
        const { hasChanges } = checkForChatChanges(chats, transformedChats);
        
        if (hasChanges || forceFull) {
          console.log('New or updated chats detected, updating state');
          setChats(transformedChats);
          
          // If active chat exists, find and update it
          if (activeChat) {
            const updatedActiveChat = transformedChats.find(chat => chat.id === activeChat.id);
            if (updatedActiveChat) {
              // Only update if there are actual changes to avoid re-renders
              if (JSON.stringify(updatedActiveChat) !== JSON.stringify(activeChat) || forceFull) {
                setActiveChat(updatedActiveChat);
              }
            }
          }
          
          // Notify about new chats
          setHasNewChats(hasChanges);
        }
        
        // If there's an active chat, refresh its messages too
        if (activeChat && forceFull) {
          await fetchMessages(activeChat.id);
        }
      }
      
      setLastRefreshTime(Date.now());
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Helper function to check if there are new chats or updates
  const checkForChatChanges = (oldChats, newChats) => {
    let hasChanges = false;
    
    // If different number of chats, something has changed
    if (oldChats.length !== newChats.length) {
      hasChanges = true;
    }
    
    // Check for changes in existing chats
    for (let i = 0; i < newChats.length; i++) {
      const oldChat = oldChats.find(chat => chat.id === newChats[i].id);
      
      // If this chat is new
      if (!oldChat) {
        hasChanges = true;
        continue;
      }
      
      // If last message changed
      if (oldChat.lastMessage !== newChats[i].lastMessage) {
        hasChanges = true;
      }
      
      // If unread status changed
      if (oldChat.unread !== newChats[i].unread) {
        hasChanges = true;
      }
    }
    
    return { hasChanges };
  };

  // Function to fetch messages for a specific chat ID
  const fetchMessages = async (chatId) => {
    if (!chatId) return;
    
    try {
      const tenantId = localStorage.getItem('tenant_id');
      const token = localStorage.getItem('token');
      
      await fetch(`http://localhost:8000/api/messages/${chatId}/`, {
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
      
      // We don't need to do anything with the response here
      // The Chatbox component will handle showing the messages
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // Manual refresh handler - always do a full refresh
  const handleManualRefresh = () => {
    refreshData(true);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const toggleDetailsDrawer = () => {
    // Force re-render of details when opening drawer
    if (!detailsOpen) {
      setDetailsKey(prevKey => prevKey + 1);
    }
    setDetailsOpen(!detailsOpen);
  };

  const closeDetailsDrawer = () => {
    setDetailsOpen(false);
  };

  // Function to handle chat selection from ChatList
  const handleChatSelect = (chat) => {
    console.log('Selected chat:', chat);
    
    // Only update if it's a different chat
    if (chat.id !== activeChat?.id) {
      setActiveChat(chat);
      
      // If details panel is open, close and reopen to refresh
      if (detailsOpen) {
        setDetailsOpen(false);
        setTimeout(() => {
          setDetailsOpen(true);
        }, 100);
      }
    }
  };

  const sendMessage = (text) => {
    if (!activeChat) return;
    
    const newMessage = {
      id: Date.now(),
      text,
      sent: true,
      timestamp: new Date()
    };
    
    const updatedChats = chats.map(chat => {
      if (chat.id === activeChat.id) {
        return {
          ...chat,
          messages: [...(chat.messages || []), newMessage],
          lastMessage: text,
          lastMessageTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      }
      return chat;
    });
    
    setChats(updatedChats);
    setActiveChat({
      ...activeChat,
      messages: [...(activeChat.messages || []), newMessage],
      lastMessage: text,
      lastMessageTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    
    // Trigger a refresh after sending a message
    setTimeout(() => refreshData(), 2000);
  };

  return (
    <Box>
      <Paper sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        height: 'calc(100vh - 136px)', 
        overflow: 'hidden',
        borderRadius: '8px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
      }}>
        {/* Tabs with Refresh Button */}
        <Box sx={{ 
          borderBottom: 1, 
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingRight: 1
        }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label={hasNewChats ? "Chats •" : "Chats"} />
            <Tab label="Templates" />
            <Tab label="Groups" />
            <Tab label="Contacts" />
          </Tabs>
          
          {activeTab === 0 && (
            <Tooltip title="Refresh chats">
              <IconButton 
                onClick={handleManualRefresh} 
                size="small"
                disabled={isRefreshing}
                color={hasNewChats ? "primary" : "default"}
              >
                <RefreshIcon 
                  className={isRefreshing ? 'rotating' : ''} 
                  fontSize="small" 
                />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {/* Content */}
        {activeTab === 0 ? (
          // Chat Interface
          <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            <Box sx={{ width: '280px', borderRight: '1px solid #e0e0e0' }}>
              <ChatList 
                chats={chats} 
                activeChat={activeChat} 
                setActiveChat={handleChatSelect} 
                refreshData={() => refreshData(true)}
                lastRefreshTime={lastRefreshTime}
                hasNewChats={hasNewChats}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Chatbox 
                activeChat={activeChat} 
                sendMessage={sendMessage}
                toggleDetailsDrawer={toggleDetailsDrawer}
                refreshData={() => refreshData(true)}
                lastRefreshTime={lastRefreshTime}
              />
            </Box>
          </Box>
        ) : activeTab === 1 ? (
          // Templates Interface
          <TemplateList />
        ) : activeTab === 2 ? (
          // Groups Interface
          <GroupList />
        ) : (
          // Contacts Interface
          <ContactList />
        )}
      </Paper>
      
      {/* Mobile overlay for the drawer */}
      <div 
        className={`chat-details-overlay ${detailsOpen ? 'open' : ''}`} 
        onClick={closeDetailsDrawer}
      ></div>
      
      {/* Chat details as a drawer - with key to force re-render */}
      <ChatDetails 
        key={detailsKey}
        activeChat={activeChat} 
        isOpen={detailsOpen} 
        onClose={closeDetailsDrawer} 
      />
    </Box>
  );
};

export default Chat; 