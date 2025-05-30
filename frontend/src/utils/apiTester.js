import api from '../services/api';

/**
 * Utility for testing API endpoints directly
 */
const apiTester = {
  /**
   * Test different API endpoints for creating notifications
   * @returns {Object} Result of the tests with success/failure status
   */
  testNotificationsEndpoint: async () => {
    // Get tenant and user ID from local storage
    const tenantId = localStorage.getItem('tenant_id');
    const userId = localStorage.getItem('user_id');
    
    if (!tenantId || !userId) {
      console.error('Missing tenant or user ID');
      return {
        success: false,
        error: 'Missing tenant or user ID',
        tenantId,
        userId
      };
    }
    
    // Create a test notification
    const testNotification = {
      tenant: tenantId,
      user: userId,
      notification_type: 'lead_assigned',
      title: 'TEST NOTIFICATION',
      message: 'This is a test notification created for debugging',
      status: 'unread',
      read_at: null
    };
    
    console.log('Test notification payload:', testNotification);
    
    // Try different API endpoints
    const methods = [
      {
        name: 'Basic path',
        url: '/notifications/',
        method: 'post'
      },
      {
        name: 'Explicit API path',
        url: '/api/notifications/',
        method: 'post'
      },
      {
        name: 'Full URL fetch',
        url: `${api.defaults.baseURL}/notifications/`,
        method: 'fetch',
        options: {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(testNotification)
        }
      }
    ];
    
    // Try each method until one succeeds
    for (const method of methods) {
      try {
        console.log(`Trying method: ${method.name}`);
        
        let response;
        if (method.method === 'fetch') {
          // Use fetch API directly
          const fetchResponse = await fetch(method.url, method.options);
          if (!fetchResponse.ok) {
            throw new Error(`Server responded with ${fetchResponse.status}: ${await fetchResponse.text()}`);
          }
          response = await fetchResponse.json();
        } else {
          // Use axios through api service
          response = await api[method.method](method.url, testNotification);
          response = response.data;
        }
        
        console.log(`Success with method: ${method.name}`, response);
        return {
          success: true,
          method: method.name,
          response,
          baseURL: api.defaults.baseURL
        };
      } catch (error) {
        console.error(`Failed with method: ${method.name}`, error);
        // Continue to next method
      }
    }
    
    // All methods failed
    return {
      success: false,
      error: 'All methods failed',
      baseURL: api.defaults.baseURL,
      axiosConfig: {
        baseURL: api.defaults.baseURL,
        headers: api.defaults.headers
      }
    };
  },
  
  /**
   * List notifications using different methods to test accessibility
   * @returns {Object} Result with success/failure status
   */
  listNotifications: async () => {
    // Try different methods to list notifications
    const methods = [
      {
        name: 'Basic path',
        url: '/notifications/',
        method: 'get'
      },
      {
        name: 'Explicit API path',
        url: '/api/notifications/',
        method: 'get'
      }
    ];
    
    // Try each method until one succeeds
    for (const method of methods) {
      try {
        console.log(`Trying to list with method: ${method.name}`);
        const response = await api[method.method](method.url);
        console.log(`Success listing with method: ${method.name}`, response.data);
        return {
          success: true,
          method: method.name,
          data: response.data,
          baseURL: api.defaults.baseURL
        };
      } catch (error) {
        console.error(`Failed listing with method: ${method.name}`, error);
        // Continue to next method
      }
    }
    
    return {
      success: false,
      error: 'All listing methods failed',
      baseURL: api.defaults.baseURL
    };
  },
  
  /**
   * Check API configuration
   * @returns {Object} API configuration information
   */
  getApiConfig: () => {
    return {
      baseURL: api.defaults.baseURL,
      headers: api.defaults.headers
    };
  }
};

export default apiTester; 