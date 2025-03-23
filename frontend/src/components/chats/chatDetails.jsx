import React from 'react';
import './chatDetails.css';

const ChatDetails = ({ activeChat }) => {
  if (!activeChat) {
    return <div className="no-chat-selected">Select a chat to view details</div>;
  }

  return (
    <div className="chat-details-container">
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
        <h3>Assignment</h3>
        <div className="detail-item">
          <span className="detail-label">Assigned To:</span>
          <span className="detail-value">{activeChat.assignedTo?.name || 'Unassigned'}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Status:</span>
          <span className="detail-value">{activeChat.status || 'Active'}</span>
        </div>
      </div>

      <div className="action-buttons">
        <button className="action-button">Update Lead</button>
        <button className="action-button">Add to Campaign</button>
      </div>
    </div>
  );
};

export default ChatDetails;
