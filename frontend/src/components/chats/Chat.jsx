import React, { useState, useEffect, useRef } from 'react';
import ChatList from './chatList';
import Chatbox from './chatbox';
import ChatDetails from './chatDetails';
import TemplateList from './TemplateList';
import GroupList from './GroupList';
import ContactList from './ContactList';
import { Box, Paper, Tabs, Tab, IconButton, Tooltip, Typography, Button, Chip } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import FilterListIcon from '@mui/icons-material/FilterList';
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
  const [noApiConfigured, setNoApiConfigured] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [totalConversations, setTotalConversations] = useState(0);
  const [roleFilterActive, setRoleFilterActive] = useState(false);
  const lastActiveChat = useRef(null);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

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

  // Get user role on component mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        const newUserRole = userData.role || '';
        // Only update if role changed
        if (newUserRole !== userRole) {
          setUserRole(newUserRole);
          // Role filtering is active for non-admin roles
          setRoleFilterActive(newUserRole && newUserRole !== 'admin');
          
          // Refresh data when role changes
          if (newUserRole) {
            refreshData(true);
          }
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  // Connect to WebSocket
  useEffect(() => {
    const connectWebSocket = () => {
      const token = localStorage.getItem('token');
      const tenant_id = localStorage.getItem('tenant_id');
      
      if (!token || !tenant_id) return;
      
      // Debug environment variables
      console.log('Environment Variables:');
      console.log('VITE_API_WS_HOST:', import.meta.env.VITE_API_WS_HOST);
      console.log('VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
      console.log('All env variables:', import.meta.env);
      
      // Use insecure WebSocket for debugging - REMOVE THIS IN PRODUCTION
      // const wsProtocol = 'ws:';
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      
      // Build the WebSocket URL
      // IMPORTANT: Temporarily hardcoding to api.arazit.com until env variables are fixed
      const wsHost = 'api.arazit.com'; // Hardcoded for now
      const wsUrl = `${wsProtocol}//${wsHost}/ws/whatsapp/?token=${token}&tenant=${tenant_id}`;
      
      console.log('Connecting to WebSocket URL:', wsUrl);
      
      const newSocket = new WebSocket(wsUrl);
      
      newSocket.onopen = () => {
        setIsConnected(true);
        console.log('WebSocket connected successfully to:', wsUrl);
      };
      
      newSocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'new_message') {
          handleNewMessage(data.data);
        } else if (data.type === 'new_chat') {
          handleNewChat(data.data);
        } else if (data.type === 'chat_assigned') {
          handleChatAssigned(data.data);
        }
      };
      
      newSocket.onclose = (event) => {
        setIsConnected(false);
        const reason = event.reason ? ` Reason: ${event.reason}` : '';
        const code = event.code ? ` Code: ${event.code}` : '';
        console.log(`WebSocket disconnected.${code}${reason}`);
        
        // Try to reconnect after 3 seconds
        setTimeout(() => {
          connectWebSocket();
        }, 3000);
      };
      
      newSocket.onerror = (error) => {
        // Provide more detailed error information
        console.error('WebSocket error:', error);
        console.error('WebSocket connection failed to:', wsUrl);
        console.error('Please check:');
        console.error('1. The VITE_API_WS_HOST environment variable is correctly set to api.arazit.com');
        console.error('2. The Daphne server is running on api.arazit.com');
        console.error('3. Your nginx configuration properly forwards WebSocket connections');
        
        newSocket.close();
      };
      
      socketRef.current = newSocket;
      setSocket(newSocket);
    };
    
    connectWebSocket();
    
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  // Function to refresh the chat data with silent option
  const refreshData = async (forceFull = false) => {
    setIsRefreshing(true);
    setNoApiConfigured(false); // Reset API configuration status
    
    try {
      // Get tenant ID and token from localStorage
      const tenantId = localStorage.getItem('tenant_id');
      const token = localStorage.getItem('token');
      
      // Fetch conversations
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/conversations/`, {
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
      
      // Check if content type is not JSON (e.g. HTML error page)
      const contentType = response.headers.get('content-type');
      if (contentType && !contentType.includes('application/json')) {
        setChats([]);
        setNoApiConfigured(true); // Set API not configured
        setIsRefreshing(false);
        setLastRefreshTime(Date.now());
        return;
      }
      
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
        
        // Set total conversations from summary if available
        if (data.summary && data.summary.total_conversations) {
          setTotalConversations(data.summary.total_conversations);
          // Check if role-based filtering is active
          setRoleFilterActive(
            data.summary.total_conversations !== data.summary.filtered_conversations
          );
        }
        
        // Check if there are new chats or updates to existing chats
        const { hasChanges } = checkForChatChanges(chats, transformedChats);
        
        if (hasChanges || forceFull) {
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
      } else if (data.error && data.error.includes('No WhatsApp API settings configured')) {
        // Clear chats if no API settings are configured
        setChats([]);
        setNoApiConfigured(true); // Set API not configured
      }
      
      setLastRefreshTime(Date.now());
    } catch (error) {
      
      // Handle the case where a JSON parsing error occurs (likely HTML response)
      if (error instanceof SyntaxError && error.message.includes('JSON')) {
        setChats([]);
        setNoApiConfigured(true); // Set API not configured
      }
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
      
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/messages/${chatId}/`, {
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

  const handleNewMessage = (messageData) => {
    // Update state with new message
    if (messageData.conversation_id === activeChat?.id) {
      // If it's for the active chat, add to active chat messages
      // ...update state with new message
      
      // Show visual cue but no sound if chat is already open
    } else {
      // If it's for another chat, update that chat's last message
      // ...update state
      
      // Show notification with sound
      showNotification(`New message from ${messageData.sender_name}`, messageData.text);
    }
    
    setHasNewChats(true);
  };
  
  const handleNewChat = (chatData) => {
    // Add new chat to the list
    setChats(prevChats => [chatData, ...prevChats]);
    setHasNewChats(true);
    
    // Show notification
    showNotification('New conversation', `New chat from ${chatData.name}`);
  };
  
  const showNotification = (title, body) => {
    // Play notification sound
    const audio = new Audio('/notification-sound.mp3');
    audio.play();
    
    // Show browser notification if permitted
    if (Notification.permission === 'granted') {
      new Notification(title, { body });
    }
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
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {activeTab === 0 && roleFilterActive && (
              <Tooltip title={userRole === 'admin' ? 'Viewing all chats' : `Viewing chats assigned to you (${userRole})`}>
                <Chip
                  icon={<FilterListIcon fontSize="small" />}
                  label={userRole === 'admin' ? 'All Chats' : 'My Chats'}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ height: '24px' }}
                />
              </Tooltip>
            )}
            
            {activeTab === 0 && totalConversations > 0 && chats.length < totalConversations && (
              <Tooltip title={`Showing ${chats.length} of ${totalConversations} total chats`}>
                <Chip
                  size="small"
                  label={`${chats.length}/${totalConversations}`}
                  variant="outlined"
                  sx={{ height: '24px' }}
                />
              </Tooltip>
            )}
            
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
                noApiConfigured={noApiConfigured}
                totalConversations={totalConversations}
                roleFilterActive={roleFilterActive}
                userRole={userRole}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Chatbox 
                activeChat={activeChat} 
                sendMessage={sendMessage}
                toggleDetailsDrawer={toggleDetailsDrawer}
                refreshData={() => refreshData(true)}
                lastRefreshTime={lastRefreshTime}
                noApiConfigured={noApiConfigured}
                userRole={userRole}
              />
            </Box>
          </Box>
        ) : noApiConfigured ? (
          // Show API Not Configured message for all tabs when API is not configured
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            padding: '2rem',
            textAlign: 'center',
            backgroundColor: '#f8f9fa'
          }}>
            <div className="no-api-icon" style={{ marginBottom: '1.5rem', animation: 'pulse 2s infinite' }}>
              <svg viewBox="0 0 24 24" width="64" height="64" fill="#25D366">
                <path d="M17.498 14.382c-.301-.15-1.767-.867-2.04-.966-.273-.101-.473-.15-.673.15-.197.295-.771.964-.944 1.162-.175.195-.349.21-.646.075-.3-.15-1.263-.465-2.403-1.485-.888-.795-1.484-1.77-1.66-2.07-.174-.3-.019-.465.13-.615.136-.135.301-.345.451-.523.146-.181.194-.301.297-.496.1-.21.049-.375-.025-.524-.075-.15-.672-1.62-.922-2.206-.24-.584-.487-.51-.672-.51-.172-.015-.371-.015-.571-.015-.2 0-.523.074-.797.359-.273.3-1.045 1.02-1.045 2.475s1.07 2.865 1.219 3.075c.149.195 2.105 3.195 5.1 4.485.714.3 1.27.48 1.704.629.714.227 1.365.195 1.88.121.574-.091 1.767-.721 2.016-1.426.255-.705.255-1.29.18-1.425-.074-.135-.27-.21-.57-.345m-5.446 7.443h-.016c-1.77 0-3.524-.48-5.055-1.38l-.36-.214-3.75.975 1.005-3.645-.239-.375c-.99-1.576-1.516-3.391-1.516-5.26 0-5.445 4.455-9.885 9.942-9.885 2.654 0 5.145 1.035 7.021 2.91 1.875 1.859 2.909 4.35 2.909 6.99-.004 5.444-4.46 9.885-9.935 9.885M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.334.101 11.893c0 2.096.549 4.14 1.595 5.945L0 24l6.335-1.652c1.746.943 3.71 1.444 5.71 1.447h.006c6.585 0 11.946-5.336 11.949-11.896 0-3.176-1.24-6.165-3.495-8.411"/>
              </svg>
            </div>
            <Typography variant="h5" sx={{ marginBottom: '1rem', color: '#333' }}>
              WhatsApp API Not Configured
            </Typography>
            <Typography variant="body1" sx={{ maxWidth: '500px', marginBottom: '2rem', color: '#666', lineHeight: 1.5 }}>
              You need to configure your WhatsApp Business API settings before you can use this feature. Configure it now to start engaging with your customers via WhatsApp.
            </Typography>
            <Button 
              variant="contained"
              sx={{
                backgroundColor: '#25D366',
                '&:hover': { backgroundColor: '#128c7e' },
                borderRadius: '24px',
                padding: '0.75rem 1.5rem',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                fontWeight: 600,
                textTransform: 'none'
              }}
              onClick={() => window.location.href = '/settings/waba-settings'}
            >
              Configure WhatsApp API
            </Button>
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