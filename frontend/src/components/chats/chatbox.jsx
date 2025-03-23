import React, { useState, useRef, useEffect } from 'react';
import { SendOutlined, MoreOutlined } from '@ant-design/icons';
import './chatbox.css';

const Chatbox = ({ activeChat, sendMessage }) => {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeChat?.messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim()) {
      sendMessage(message);
      setMessage('');
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
        <button className="more-options">
          <MoreOutlined />
        </button>
      </div>

      <div className="messages-container">
        {activeChat.messages?.map((msg, index) => (
          <div 
            key={index} 
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
              <p>{msg.text}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form className="message-input-container" onSubmit={handleSendMessage}>
        <input
          type="text"
          placeholder="Enter a prompt here"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="message-input"
        />
        <button type="submit" className="send-button">
          <SendOutlined className="send-icon" />
        </button>
      </form>
    </div>
  );
};

export default Chatbox;
