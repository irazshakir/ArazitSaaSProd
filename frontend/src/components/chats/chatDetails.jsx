import React from 'react';
import { CloseOutlined } from '@ant-design/icons';
import './chatDetails.css';

const ChatDetails = ({ activeChat, isOpen, onClose }) => {
  if (!activeChat) {
    return null;
  }

  return (
    <div className={`chat-details-drawer ${isOpen ? 'open' : ''}`}>
      <div className="drawer-header">
        <h2>Chat Details</h2>
        <button className="close-button" onClick={onClose}>
          <CloseOutlined />
        </button>
      </div>

      <div className="drawer-content">
        <div className="details-section">
          <h3>Lead Information</h3>
          <div className="detail-item">
            <span className="detail-label">Name:</span>
            <span className="detail-value">{activeChat.leadDetails?.name || activeChat.name}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Phone:</span>
            <span className="detail-value">{activeChat.leadDetails?.phone || 'N/A'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Email:</span>
            <span className="detail-value">{activeChat.leadDetails?.email || 'N/A'}</span>
          </div>
        </div>

        <div className="details-section">
          <h3>Product Details</h3>
          <div className="detail-item">
            <span className="detail-label">Interested In:</span>
            <span className="detail-value">{activeChat.productDetails?.name || 'N/A'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Price:</span>
            <span className="detail-value">{activeChat.productDetails?.price || 'N/A'}</span>
          </div>
        </div>

        <div className="details-section">
          <h3>Lead Information</h3>
          <div className="detail-item">
            <span className="detail-label">Lead Type:</span>
            <span className="detail-value">{activeChat.leadDetails?.type || 'Regular'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Status:</span>
            <span className="detail-value">{activeChat.status || 'Active'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Lead Source:</span>
            <span className="detail-value">{activeChat.leadDetails?.source || 'Website'}</span>
          </div>
        </div>

        <div className="details-section">
          <h3>Assignment</h3>
          <div className="detail-item">
            <span className="detail-label">Assigned To:</span>
            <span className="detail-value">{activeChat.assignedTo?.name || 'Unassigned'}</span>
          </div>
        </div>

        <div className="action-buttons">
          <button className="action-button">Update Lead</button>
        </div>
      </div>
    </div>
  );
};

export default ChatDetails;
