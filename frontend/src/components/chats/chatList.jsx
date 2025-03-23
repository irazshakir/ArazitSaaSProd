import React, { useState } from 'react';
import { SearchOutlined, UserOutlined, TeamOutlined } from '@ant-design/icons';
import './chatList.css';

const ChatList = ({ chats, activeChat, setActiveChat }) => {
  const [activeTab, setActiveTab] = useState('personal');

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
            className={`chat-item ${activeChat?.id === chat.id ? 'active' : ''}`}
            onClick={() => setActiveChat(chat)}
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
