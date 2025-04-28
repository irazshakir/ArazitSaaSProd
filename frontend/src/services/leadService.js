import api from './api';

/**
 * Service for lead-related operations
 */
const leadService = {
  /**
   * Assign a lead to a user and create notification
   * @param {string} leadId - The ID of the lead to assign
   * @param {string} userId - The ID of the user to assign the lead to
   * @param {Object} leadData - Basic lead data (name, etc.)
   * @returns {Promise} - The API response
   */
  assignLead: async (leadId, userId, leadData = {}) => {
    try {
      const assignResponse = await api.post(`/leads/${leadId}/assign/`, {
        user_id: userId
      });
      
      return assignResponse;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Transfer a lead from one user to another and create notification
   * @param {string} leadId - The ID of the lead to transfer
   * @param {string} userId - The ID of the user to transfer the lead to
   * @param {string} fromUserId - The ID of the user transferring the lead
   * @param {Object} leadData - Basic lead data (name, etc.)
   * @returns {Promise} - The API response
   */
  transferLead: async (leadId, userId, fromUserId, leadData = {}) => {
    try {
      const transferResponse = await api.post(`/leads/${leadId}/assign/`, {
        user_id: userId
      });
      
      return transferResponse;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Create a notification for a lead
   * @param {Object} notificationData - Notification data
   * @returns {Promise} - The API response
   */
  createNotification: async (notificationData) => {
    try {
      const response = await api.post('/notifications/', {
        ...notificationData,
        status: 'unread',
        read_at: null
      });
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default leadService; 