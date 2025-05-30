import api from './api';
import { getUser } from '../utils/auth';

/**
 * WABA Service - provides access to WhatsApp Business API settings and functionality
 */
const wabaService = {
  /**
   * Get WABA settings for the current tenant
   * @returns {Promise} - Promise resolving to WABA settings
   */
  getSettings: async () => {
    try {
      // Get user and token info from localStorage
      const user = JSON.parse(localStorage.getItem('user'));
      const token = localStorage.getItem('token') || localStorage.getItem('access_token');

      if (!user || !token) {
        throw new Error('No user or authentication token found');
      }

      // Use the correct endpoint from backend URLs config
      const response = await api.get('/settings/');
      
      // Handle different response formats
      if (response.data && typeof response.data === 'object') {
        // If it's a paginated response with results array
        if (response.data.results && Array.isArray(response.data.results)) {
          if (response.data.results.length > 0) {
            return response.data.results[0];
          } else {
            return {
              api_url: 'https://apps.oncloudapi.com',
              email: '',
              password: '',
              is_active: true,
              api_key: '',
              api_secret: '',
              phone_number_id: '',
              business_account_id: '',
              webhook_verify_token: '',
              webhook_url: ''
            };
          }
        }
        // If it's a direct object response
        else if (!Array.isArray(response.data)) {
          return response.data;
        }
      }
      
      // If it's a direct array 
      if (Array.isArray(response.data) && response.data.length > 0) {
        return response.data[0];
      }
      
      // Default fallback if no data found
      return {
        api_url: 'https://apps.oncloudapi.com',
        email: '',
        password: '',
        is_active: true,
        api_key: '',
        api_secret: '',
        phone_number_id: '',
        business_account_id: '',
        webhook_verify_token: '',
        webhook_url: ''
      };
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Create or update WABA settings
   * @param {Object} settings - WABA settings data
   * @returns {Promise} - Promise resolving to the saved settings
   */
  saveSettings: async (settings) => {
    try {
      // Get user and token info from localStorage
      const user = JSON.parse(localStorage.getItem('user'));
      const token = localStorage.getItem('token') || localStorage.getItem('access_token');

      if (!user || !token) {
        throw new Error('No user or authentication token found');
      }

      // Determine if this is a create or update operation
      const isUpdate = settings.id !== undefined;
      const endpoint = isUpdate ? `/settings/${settings.id}/` : '/settings/';
      const method = isUpdate ? 'put' : 'post';
      
      const response = await api[method](endpoint, settings);
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default wabaService; 