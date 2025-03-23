import React, { useState, useEffect } from 'react';
import ChatList from './chatList';
import Chatbox from './chatbox';
import ChatDetails from './chatDetails';
import { Box, Paper } from '@mui/material';
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

  useEffect(() => {
    // Set first chat as active on initial load
    if (chats.length > 0 && !activeChat) {
      setActiveChat(chats[0]);
    }
  }, [chats]);

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
  };

  return (
    <Box>
      <Paper sx={{ 
        display: 'flex', 
        height: 'calc(100vh - 136px)', 
        overflow: 'hidden',
        borderRadius: '8px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
      }}>
        <Box sx={{ width: '280px', borderRight: '1px solid #e0e0e0' }}>
          <ChatList 
            chats={chats} 
            activeChat={activeChat} 
            setActiveChat={setActiveChat} 
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Chatbox 
            activeChat={activeChat} 
            sendMessage={sendMessage} 
          />
        </Box>
        <Box sx={{ width: '280px', borderLeft: '1px solid #e0e0e0' }}>
          <ChatDetails activeChat={activeChat} />
        </Box>
      </Paper>
    </Box>
  );
};

export default Chat; 