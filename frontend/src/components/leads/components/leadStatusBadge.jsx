import React from 'react';
import { Tag } from 'antd';

/**
 * Component for displaying lead status with appropriate color
 * @param {string} status - The lead status value
 * @param {string} size - Size of the badge ('default' or 'small')
 */
const LeadStatusBadge = ({ status, size = 'default' }) => {
  // Get color based on status
  const getStatusColor = () => {
    switch(status) {
      case 'new':
        return 'blue';
      case 'qualified':
        return 'green';
      case 'non_potential':
        return 'gray';
      case 'proposal':
        return 'orange';
      case 'negotiation':
        return 'purple';
      case 'won':
        return 'success';
      case 'lost':
        return 'error';
      default:
        return 'default';
    }
  };
  
  // Get display text based on status
  const getStatusText = () => {
    switch(status) {
      case 'new':
        return 'New';
      case 'qualified':
        return 'Qualified';
      case 'non_potential':
        return 'Non-Potential';
      case 'proposal':
        return 'Proposal';
      case 'negotiation':
        return 'Negotiation';
      case 'won':
        return 'Won';
      case 'lost':
        return 'Lost';
      default:
        return status || 'Unknown';
    }
  };
  
  return (
    <Tag color={getStatusColor()} style={{ fontSize: size === 'small' ? '0.8rem' : '0.9rem' }}>
      {getStatusText()}
    </Tag>
  );
};

export default LeadStatusBadge;
