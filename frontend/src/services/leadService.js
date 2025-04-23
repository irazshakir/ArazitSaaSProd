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
      console.log(`Assigning lead ${leadId} to user ${userId}`);
      
      // Assign the lead using the official API endpoint
      // The backend will create the notification automatically
      const assignResponse = await api.post(`/leads/${leadId}/assign/`, {
        user_id: userId
      });
      
      console.log('Lead assigned successfully:', assignResponse.data);
      
      return assignResponse;
    } catch (error) {
      console.error('Error assigning lead:', error.response?.data || error.message);
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
      console.log(`Transferring lead ${leadId} from user ${fromUserId} to user ${userId}`);
      
      // Transfer the lead using the assign endpoint
      // The backend will create the notification automatically
      const transferResponse = await api.post(`/leads/${leadId}/assign/`, {
        user_id: userId
      });
      
      console.log('Lead transferred successfully:', transferResponse.data);
      
      return transferResponse;
    } catch (error) {
      console.error('Error transferring lead:', error.response?.data || error.message);
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
      console.log('Creating notification via service with payload:', notificationData);
      
      const response = await api.post('/notifications/', {
        ...notificationData,
        status: 'unread',
        read_at: null
      });
      
      console.log('Notification created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating notification:', error.response?.data || error.message);
      throw error;
    }
  }
};

export default leadService; 