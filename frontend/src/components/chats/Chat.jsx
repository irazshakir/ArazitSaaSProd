import React, { useState, useEffect, useRef } from 'react';
import ChatList from './chatList';
import Chatbox from './chatbox';
import ChatDetails from './chatDetails';
import TemplateList from './TemplateList';
import GroupList from './GroupList';
import ContactList from './ContactList';
import { Box, Paper, Tabs, Tab, IconButton, Tooltip, Typography, Button, Chip, Slide } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import FilterListIcon from '@mui/icons-material/FilterList';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import './Chat.css';

// Add this CSS at the top of the file
const mobileStyles = `
  .mobile-chat-container {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .mobile-chat-list {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: #fff;
    transition: transform 0.3s ease-in-out;
    z-index: 2;
  }

  .mobile-chat-box {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: #fff;
    transition: transform 0.3s ease-in-out;
    z-index: 1;
  }

  .mobile-chat-list.slide-left {
    transform: translateX(-100%);
  }

  .mobile-chat-box.slide-right {
    transform: translateX(100%);
  }

  .mobile-header {
    display: flex;
    align-items: center;
    padding: 8px 16px;
    background: #075E54;
    color: white;
  }

  .mobile-header h1 {
    margin: 0;
    font-size: 20px;
    margin-left: 16px;
  }

  .mobile-back-button {
    color: white !important;
  }
`;

const Chat = () => {
  const [activeChat, setActiveChat] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [detailsKey, setDetailsKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(Date.now());
  const [hasNewChats, setHasNewChats] = useState(false);
  const [noApiConfigured, setNoApiConfigured] = useState(false);
  const [userRole, setUserRole] = useState('user');
  const [totalConversations, setTotalConversations] = useState(0);
  const [roleFilterActive, setRoleFilterActive] = useState(false);
  const lastActiveChat = useRef(null);
  const [chatsLoading, setChatsLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [chats, setChats] = useState([]);
  const pollIntervalRef = useRef(null);
  const [seenMessageIds, setSeenMessageIds] = useState(new Set());
  const [lastProcessedChats, setLastProcessedChats] = useState([]);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Modified useEffect to handle mobile differently
  useEffect(() => {
    if (chats.length > 0) {
      if (!isMobile) {
        // On desktop, set first chat as active
        if (!activeChat) {
          setActiveChat(chats[0]);
        }
      } else {
        // On mobile, only set active chat if user has explicitly selected one
        if (activeChat && !chats.find(chat => chat.id === activeChat.id)) {
          setActiveChat(null); // Reset active chat if it no longer exists
        }
      }
    }
  }, [chats, isMobile]);

  // Reset active chat when switching to mobile view
  useEffect(() => {
    if (isMobile) {
      setActiveChat(null);
    }
  }, [isMobile]);

  // When active chat changes, increment details key to force re-render
  useEffect(() => {
    if (activeChat) {
      setDetailsKey(prevKey => prevKey + 1);
      // Store the active chat ID for comparison
      lastActiveChat.current = activeChat.id;
    }
  }, [activeChat?.id]);

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
        // Silent error handling for user role retrieval
      }
    }
  }, []);

  // Start polling when component mounts
  useEffect(() => {
    // Initial fetch
    refreshData(true);
    
    // Set up polling every 3 seconds
    pollIntervalRef.current = setInterval(() => {
      // Use the quieter background refresh for polling updates
      backgroundRefreshData();
    }, 3000);
    
    // Clean up interval on component unmount
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  // A quieter background refresh that doesn't trigger loading indicators
  const backgroundRefreshData = async () => {
    // Don't refresh if already refreshing
    if (isRefreshing) return;
    
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
      
      if (!response.ok) return;
      
      const contentType = response.headers.get('content-type');
      if (contentType && !contentType.includes('application/json')) return;
      
      const data = await response.json();
      
      if (data.status !== 'success') return;
      
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
        setRoleFilterActive(
          data.summary.total_conversations !== data.summary.filtered_conversations
        );
      }
      
      // Find new chats and chats with updated messages
      const existingChatIds = new Set(chats.map(chat => chat.id));
      const newChats = transformedChats.filter(chat => !existingChatIds.has(chat.id));
      
      // Find chats with new messages by comparing lastMessage
      const chatMap = chats.reduce((acc, chat) => {
        acc[chat.id] = chat.lastMessage;
        return acc;
      }, {});
      
      // Create a combined array of both new chats and existing chats with new messages
      const newContentChats = [...newChats];
      transformedChats.forEach(chat => {
        if (chatMap[chat.id] && chat.lastMessage !== chatMap[chat.id]) {
          // Only add if it's not already there
          if (!newChats.some(newChat => newChat.id === chat.id)) {
            newContentChats.push(chat);
          }
        }
      });
      
      // Only play notification if we have new content
      if (newContentChats.length > 0 && chats.length > 0) {
        // Check if we've already processed these chats
        const chatSignatures = newContentChats.map(c => `${c.id}:${c.lastMessage}`);
        const lastProcessedSignatures = lastProcessedChats.map(c => `${c.id}:${c.lastMessage}`);
        
        // Only notify if new content
        if (!chatSignatures.every(sig => lastProcessedSignatures.includes(sig))) {
          setHasNewChats(true);
          
          // Only play notification for incoming messages (not sent by the current user)
          const incomingMessages = newContentChats.filter(chat => chat.unread);
          if (incomingMessages.length > 0) {
            playNotificationSound();
          }
          
          // Update the last processed chats
          setLastProcessedChats(newContentChats);
        }
      }
      
      // If active chat exists, preserve its messages but update other properties
      if (activeChat) {
        const updatedActiveChat = transformedChats.find(chat => chat.id === activeChat.id);
        if (updatedActiveChat) {
          // Create a merged version with updated props but preserved messages
          const mergedActiveChat = {
            ...updatedActiveChat,
            messages: activeChat.messages || [] // Keep existing messages
          };
          
          // Only update active chat if there are differences
          if (activeChat.lastMessage !== mergedActiveChat.lastMessage) {
            setActiveChat(mergedActiveChat);
            // Fetch new messages for active chat in background
            backgroundFetchMessages(activeChat.id);
          }
        }
      }
      
      // Merge existing chats with new data to avoid UI disruption
      const mergedChats = [...transformedChats];
      
      // Set the merged chat list
      setChats(mergedChats);
      setLastRefreshTime(Date.now());
    } catch (error) {
      // Silent error handling for background updates
    }
  };

  // Function to fetch messages for a specific chat ID in the background
  const backgroundFetchMessages = async (chatId) => {
    if (!chatId) return;
    
    try {
      const tenantId = localStorage.getItem('tenant_id');
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/messages/${chatId}/`, {
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
      
      if (!response.ok) return;
      
      const data = await response.json();
      if (data.status !== 'success' || !data.data) return;
      
      // Only proceed if this is for the active chat
      if (activeChat && activeChat.id === chatId) {
        // Transform the messages to the expected format
        const transformedMessages = data.data.map(msg => ({
          id: msg.id,
          text: msg.text || '',
          sent: !msg.sent_by_contact,
          timestamp: new Date(msg.timestamp),
          isImage: msg.is_image || false,
          image_url: msg.image_url || null
        }));
        
        // Check if we have new messages to add
        if (!activeChat.messages || 
            activeChat.messages.length !== transformedMessages.length) {
          
          // If we have existing messages, merge the new ones
          if (activeChat.messages && activeChat.messages.length > 0) {
            // Find only new messages
            const existingIds = new Set(activeChat.messages.map(m => m.id));
            const newMessages = transformedMessages.filter(m => !existingIds.has(m.id));
            
            // If we found new messages, add them
            if (newMessages.length > 0) {
              const updatedMessages = [...activeChat.messages, ...newMessages];
              updatedMessages.sort((a, b) => a.timestamp - b.timestamp);
              
              // Update the active chat with the new messages only if needed
              setActiveChat(prevChat => ({
                ...prevChat,
                messages: updatedMessages
              }));
            }
          } else {
            // No existing messages, simply set the new ones
            setActiveChat(prevChat => ({
              ...prevChat,
              messages: transformedMessages
            }));
          }
        }
      }
    } catch (error) {
      // Silent error handling for background updates
    }
  };

  // Function to refresh the chat data
  const refreshData = async (forceFull = true) => {
    // Don't refresh if already refreshing (prevent multiple concurrent requests)
    if (isRefreshing) return;
    
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
        
        // Find new chats that weren't in the previous list
        const existingChatIds = new Set(chats.map(chat => chat.id));
        const newChats = transformedChats.filter(chat => !existingChatIds.has(chat.id));
        
        // Find chats with new messages by comparing lastMessage with previous last message
        const chatMap = chats.reduce((acc, chat) => {
          acc[chat.id] = chat.lastMessage;
          return acc;
        }, {});
        
        // Create a combined array of both new chats and existing chats with new messages
        const newContentChats = [...newChats];
        transformedChats.forEach(chat => {
          if (chatMap[chat.id] && chat.lastMessage !== chatMap[chat.id]) {
            // Only add to newContentChats if it's not already there
            if (!newChats.some(newChat => newChat.id === chat.id)) {
              newContentChats.push(chat);
            }
          }
        });
        
        // Only play notification if we have new content AND we're not on the first load
        if (newContentChats.length > 0 && chats.length > 0) {
          // Check if we've already processed these exact chats by comparing IDs and lastMessages
          const chatSignatures = newContentChats.map(c => `${c.id}:${c.lastMessage}`);
          const lastProcessedSignatures = lastProcessedChats.map(c => `${c.id}:${c.lastMessage}`);
          
          // Only play notification and set new chats flag if these are different chats/messages
          if (!chatSignatures.every(sig => lastProcessedSignatures.includes(sig))) {
            setHasNewChats(true);
            
            // Only play notification for incoming messages (not sent by the current user)
            const incomingMessages = newContentChats.filter(chat => chat.unread);
            if (incomingMessages.length > 0) {
              playNotificationSound();
            }
            
            // Update the last processed chats
            setLastProcessedChats(newContentChats);
          }
        }
        
        setChats(transformedChats);
        
        // If active chat exists, find and update it
        if (activeChat) {
          const updatedActiveChat = transformedChats.find(chat => chat.id === activeChat.id);
          if (updatedActiveChat) {
            // Need to preserve messages that may already be loaded in the active chat
            if (activeChat.messages && activeChat.messages.length > 0) {
              updatedActiveChat.messages = activeChat.messages;
            }
            setActiveChat(updatedActiveChat);
          }
        }
        
        // If there's an active chat, refresh its messages too
        if (activeChat) {
          await fetchMessages(activeChat.id);
        }
      } else if (data.error && data.error.includes('No WhatsApp API settings configured')) {
        // Clear chats if no API settings are configured
        setChats([]);
        setNoApiConfigured(true); // Set API not configured
      }
      
      setLastRefreshTime(Date.now());
    } catch (error) {
      // Silent error handling for background updates
    } finally {
      setIsRefreshing(false);
    }
  };

  // Function to fetch messages for a specific chat ID
  const fetchMessages = async (chatId) => {
    if (!chatId) return;
    
    try {
      const tenantId = localStorage.getItem('tenant_id');
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/messages/${chatId}/`, {
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
      
      // Check if the response is OK
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success' && data.data) {
          // Store the messages in the activeChat object
          if (activeChat && activeChat.id === chatId) {
            // Transform the messages to the expected format
            const transformedMessages = data.data.map(msg => ({
              id: msg.id,
              text: msg.text || '',
              sent: !msg.sent_by_contact,
              timestamp: new Date(msg.timestamp),
              isImage: msg.is_image || false,
              image_url: msg.image_url || null
            }));
            
            // Update the activeChat with the new messages
            setActiveChat(prevChat => ({
              ...prevChat,
              messages: transformedMessages
            }));
          }
        }
      }
    } catch (error) {
      // Silent error handling for background updates
    }
  };

  // Manual refresh handler - always do a full refresh
  const handleManualRefresh = () => {
    setHasNewChats(false);
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

  // Modified chat selection handler
  const handleChatSelect = (chat) => {
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
    setTimeout(() => refreshData(true), 2000);
  };

  // Function to play notification sound
  const playNotificationSound = () => {
    try {
      // Create a soft notification sound using Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create oscillator and gain nodes
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      // Set up soft notification sound parameters
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // Higher pitch (A5)
      
      // Create a short fade in/out effect for a softer sound
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.05);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.4);
      
      // Connect audio nodes
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Play the sound
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.4);
      
      // Optional: Add a second tone for a more pleasant notification
      setTimeout(() => {
        try {
          const secondContext = new (window.AudioContext || window.webkitAudioContext)();
          const osc2 = secondContext.createOscillator();
          const gain2 = secondContext.createGain();
          
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(1046.5, secondContext.currentTime); // C6
          
          gain2.gain.setValueAtTime(0, secondContext.currentTime);
          gain2.gain.linearRampToValueAtTime(0.15, secondContext.currentTime + 0.05);
          gain2.gain.linearRampToValueAtTime(0, secondContext.currentTime + 0.3);
          
          osc2.connect(gain2);
          gain2.connect(secondContext.destination);
          
          osc2.start();
          osc2.stop(secondContext.currentTime + 0.3);
        } catch (err) {
          // Ignore error if second tone fails
        }
      }, 100);
      
    } catch (error) {
      // Silent error handling for background updates
    }
  };

  return (
    <Box>
      <style>{mobileStyles}</style>
      <Paper sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        height: { xs: 'calc(100vh - 110px)', md: 'calc(100vh - 136px)' }, 
        overflow: 'hidden',
        borderRadius: '8px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
      }}>
        {/* Tabs with Refresh Button */}
        <Box sx={{ 
          borderBottom: 1, 
          borderColor: 'divider',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingRight: 1,
          display: { xs: 'none', md: 'flex' } // Hide on mobile, show as flex on desktop
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
            {isMobile ? (
              // Mobile WhatsApp-like UI
              <div className="mobile-chat-container">
                {/* Chat List View - Always render and control visibility with transform */}
                <div className={`mobile-chat-list ${activeChat ? 'slide-left' : ''}`}>
                  <div className="mobile-header">
                    <h1>Chats</h1>
                  </div>
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
                </div>

                {/* Chat Box View - Only mount when there's an active chat */}
                {activeChat && (
                  <div className={`mobile-chat-box ${!activeChat ? 'slide-right' : ''}`}>
                    <div className="mobile-header">
                      <IconButton 
                        className="mobile-back-button"
                        onClick={() => setActiveChat(null)}
                      >
                        <ArrowBackIcon />
                      </IconButton>
                      <h1>{activeChat.name || activeChat.phone}</h1>
                    </div>
                    <Chatbox 
                      activeChat={activeChat} 
                      sendMessage={sendMessage}
                      toggleDetailsDrawer={toggleDetailsDrawer}
                      refreshData={() => refreshData(true)}
                      lastRefreshTime={lastRefreshTime}
                      noApiConfigured={noApiConfigured}
                      userRole={userRole}
                      typing={false}
                      lastTypingUpdate={null}
                    />
                  </div>
                )}
              </div>
            ) : (
              // Desktop UI remains unchanged
              <>
                <Box sx={{ 
                  width: '280px', 
                  borderRight: '1px solid #e0e0e0',
                  display: 'block'
                }}>
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
                    typing={false}
                    lastTypingUpdate={null}
                  />
                </Box>
              </>
            )}
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

      {/* Status indicator in production */}
      <Box sx={{ 
        padding: '2px 8px',
        fontSize: '10px',
        backgroundColor: '#e8f5e9',
        color: '#2e7d32',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomLeftRadius: '8px',
        borderBottomRightRadius: '8px'
      }}>
        <span>
          🟢 Auto-refresh active (every 3 seconds)
        </span>
        <span>
          Last updated: {new Date(lastRefreshTime).toLocaleTimeString()}
        </span>
      </Box>
    </Box>
  );
};

export default Chat; 
