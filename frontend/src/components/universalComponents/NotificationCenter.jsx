import React, { useState, useEffect, useRef } from 'react';
import { Badge, Popover, List, Button, Typography, Space, Spin, Empty, message, Tooltip } from 'antd';
import { BellOutlined, CheckOutlined, BugOutlined, SyncOutlined } from '@ant-design/icons';
import api from '../../services/api';
import apiTester from '../../utils/apiTester';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Text } = Typography;

const NotificationCenter = ({ onNewNotification, onClick }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [visible, setVisible] = useState(false);
  const [lastNotificationId, setLastNotificationId] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [debugMode, setDebugMode] = useState(false);
  const [apiTestResult, setApiTestResult] = useState(null);

  // Toggle the visibility of the popover
  const toggleVisible = (event) => {
    // Ensure we have a valid event before calling stopPropagation
    if (event && event.nativeEvent && typeof event.stopPropagation === 'function') {
      event.stopPropagation();
    } else if (event && typeof event.stopPropagation === 'function') {
      event.stopPropagation();
    }
    
    // Create a new visible state value
    const newVisibleState = !visible;
    
    // If we're opening the popover, refresh the notifications
    if (newVisibleState) {
      console.log('Opening notification popover, refreshing notifications');
      fetchNotificationsWithFallbacks();
    }
    
    // If we have an external onClick handler from parent component, use it
    if (onClick && typeof onClick === 'function') {
      // Make sure to pass a valid event or null
      onClick(event && event.nativeEvent ? event : event || null);
    } else {
      // Toggle visibility ourselves if no external handler
      setVisible(newVisibleState);
      setAnchorEl(event?.currentTarget || null);
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      // Get user and tenant IDs from localStorage
      const userId = localStorage.getItem('user_id');
      const tenantId = localStorage.getItem('tenant_id');
      const token = localStorage.getItem('token');
      
      console.log('Fetching notifications with user ID:', userId, 'and tenant ID:', tenantId);
      
      // Make the API request with query parameters to filter by user, tenant, and status=unread
      const response = await api.get('/notifications/', {
        params: {
          user: userId,
          tenant: tenantId,
          status: 'unread'
        },
        headers: token ? {
          'Authorization': `Bearer ${token}`
        } : undefined
      });
      
      console.log('Fetched notifications response:', response);
      console.log('Raw response data:', JSON.stringify(response.data));
      
      // Get the notifications from the response
      // Handle both formats: direct array or paginated results
      let notificationsData = [];
      if (response.data && Array.isArray(response.data)) {
        // Direct array format
        notificationsData = response.data;
      } else if (response.data && Array.isArray(response.data.results)) {
        // Paginated format
        notificationsData = response.data.results;
      } else if (response.data && typeof response.data === 'object') {
        // Try to extract data if it's an object
        console.log('Response is an object, trying to extract notifications');
        if (Array.isArray(response.data.data)) {
          notificationsData = response.data.data;
        } else {
          // Last resort - try to convert the object to an array
          console.log('Trying to convert object to array');
          const possibleArrays = Object.values(response.data).filter(val => Array.isArray(val));
          if (possibleArrays.length > 0) {
            notificationsData = possibleArrays[0];
          }
        }
      }
      
      console.log('Processed notifications data:', notificationsData);
      
      // Get unread count with same authorization
      const countResponse = await api.get('/notifications/unread-count/', {
        headers: token ? {
          'Authorization': `Bearer ${token}`
        } : undefined
      });
      const unreadCount = countResponse.data.count || 0;
      setUnreadCount(unreadCount);
      console.log('Unread count:', unreadCount);
      
      // Check if we have any notifications
      if (notificationsData && notificationsData.length > 0) {
        const newestNotification = notificationsData[0];
        console.log('Newest notification:', newestNotification);
        
        // If this is our first load, just set the last notification ID
        if (lastNotificationId === null) {
          setLastNotificationId(newestNotification.id);
        } 
        // If we have a new notification that's different from the last one we saw
        else if (lastNotificationId !== newestNotification.id) {
          console.log('New notification detected:', newestNotification);
          if (onNewNotification && newestNotification.status === 'unread') {
            onNewNotification(newestNotification);
          }
          setLastNotificationId(newestNotification.id);
        }
        
        setNotifications(notificationsData);
      } else {
        console.log('No notifications found or empty response');
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
      }
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      if (!notificationId) {
        console.error('Missing notification ID');
        return false;
      }
      
      message.loading({ content: 'Marking notification as read...', key: 'markRead' });
      
      console.log(`Marking notification ${notificationId} as read`);
      console.log('API base URL:', api.defaults.baseURL);
      
      // Log the current notification state before marking as read
      const notification = notifications.find(n => n.id === notificationId);
      console.log('Notification before marking as read:', notification);
      
      // IMPORTANT: Use the exact backend URL format without any body
      // This matches the Django REST style URL pattern in backend/leads/urls.py
      const url = `/notifications/${notificationId}/mark-as-read/`;
      console.log('Using URL:', url);
      
      const response = await api.post(url);
      
      console.log('Mark as read response:', response);
      
      // Update the UI state
      setNotifications(prevNotifications =>
        prevNotifications.map(notification =>
          notification.id === notificationId
            ? { ...notification, status: 'read', read_at: new Date().toISOString() }
            : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      message.success({ content: 'Notification marked as read', key: 'markRead' });
      
      // Force refresh after marking as read
      setTimeout(() => {
        fetchNotificationsWithFallbacks();
      }, 1000);
      
      return true;
    } catch (error) {
      console.error(`Error marking notification ${notificationId} as read:`, error);
      message.error({ 
        content: 'Failed to mark notification as read', 
        key: 'markRead' 
      });
      
      return false;
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      message.loading({ content: 'Marking all notifications as read...', key: 'markAllRead' });
      
      console.log('Marking all notifications as read');
      console.log('Current notifications count:', notifications.length);
      console.log('Unread count:', unreadCount);
      console.log('API base URL:', api.defaults.baseURL);
      
      // IMPORTANT: Use the exact backend URL format without any body
      // This matches the Django REST style URL pattern in backend/leads/urls.py
      const url = `/notifications/mark-all-as-read/`;
      console.log('Using URL:', url);
      
      const response = await api.post(url);
      
      console.log('Mark all as read response:', response);
      
      // If the API call succeeds, update the local state
      setNotifications(prevNotifications =>
        prevNotifications.map(notification => ({
          ...notification,
          status: 'read',
          read_at: new Date().toISOString()
        }))
      );
      setUnreadCount(0);
      
      message.success({ content: 'All notifications marked as read', key: 'markAllRead' });
      
      // Refresh the notifications list after a short delay
      setTimeout(() => {
        fetchNotificationsWithFallbacks();
      }, 500);
      
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      message.error({ 
        content: 'Failed to mark notifications as read. Please try again.', 
        key: 'markAllRead'
      });
      
      return false;
    }
  };

  // Toggle debug mode (hidden feature)
  const toggleDebugMode = () => {
    setDebugMode(!debugMode);
    if (!debugMode) {
      message.info('Debug mode enabled');
    } else {
      setApiTestResult(null);
      message.info('Debug mode disabled');
    }
  };

  // Test API endpoints for debugging
  const testNotificationsApi = async () => {
    message.loading({ content: 'Testing notifications API...', key: 'apiTest' });
    try {
      const result = await apiTester.testNotificationsEndpoint();
      setApiTestResult(result);
      if (result.success) {
        message.success({ content: `API test successful using ${result.method}`, key: 'apiTest' });
        fetchNotifications(); // Refresh to see the test notification
      } else {
        message.error({ content: `API test failed: ${result.error}`, key: 'apiTest' });
      }
    } catch (error) {
      setApiTestResult({ success: false, error: error.message });
      message.error({ content: `API test error: ${error.message}`, key: 'apiTest' });
    }
  };

  // Debug notification path issue
  const debugNotificationPaths = async () => {
    message.loading({ content: 'Testing notification list endpoints...', key: 'listTest' });
    try {
      const result = await apiTester.listNotifications();
      setApiTestResult(result);
      if (result.success) {
        message.success({ content: `List test successful using ${result.method}`, key: 'listTest' });
      } else {
        message.error({ content: `List test failed: ${result.error}`, key: 'listTest' });
      }
    } catch (error) {
      setApiTestResult({ success: false, error: error.message });
      message.error({ content: `List test error: ${error.message}`, key: 'listTest' });
    }
  };

  const checkApiConfig = () => {
    const config = apiTester.getApiConfig();
    setApiTestResult(config);
    message.info('API configuration loaded');
  };

  // Test direct API access
  const testDirectAPI = async () => {
    try {
      message.loading({ content: 'Testing direct API access...', key: 'directAPI' });
      
      const userId = localStorage.getItem('user_id');
      const tenantId = localStorage.getItem('tenant_id');
      const token = localStorage.getItem('token');
      
      // Try a direct fetch to the API to bypass any interceptor issues
      const url = `${api.defaults.baseURL}/notifications/?user=${userId}&tenant=${tenantId}&status=unread`;
      console.log('Trying direct fetch to:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Direct API test result:', data);
      
      message.success({ content: 'Direct API call successful', key: 'directAPI' });
      
      // If we got data and the regular fetch failed, use this data
      if (data && (Array.isArray(data) || Array.isArray(data.results)) && notifications.length === 0) {
        const notificationsData = Array.isArray(data) ? data : data.results;
        console.log('Using direct API data for notifications:', notificationsData);
        setNotifications(notificationsData);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Direct API test failed:', error);
      message.error({ content: `Direct API test failed: ${error.message}`, key: 'directAPI' });
      return false;
    }
  };

  // Fetch notifications with multiple fallback strategies
  const fetchNotificationsWithFallbacks = async () => {
    try {
      // First try the regular API
      await fetchNotifications();
      
      // If no notifications were found, try direct API access
      if (notifications.length === 0 && unreadCount > 0) {
        console.log('Regular fetch returned no notifications but unread count > 0, trying direct API');
        await testDirectAPI();
      }
    } catch (error) {
      console.error('All notification fetch methods failed:', error);
    }
  };

  // Load notifications on component mount and every 30 seconds
  useEffect(() => {
    console.log('NotificationCenter mounted, fetching notifications');
    fetchNotificationsWithFallbacks();
    
    // Set up polling for new notifications (every 30 seconds)
    const interval = setInterval(() => {
      console.log('Polling for new notifications');
      fetchNotificationsWithFallbacks();
    }, 30000);
    
    return () => {
      console.log('NotificationCenter unmounted, clearing interval');
      clearInterval(interval);
    };
  }, []);

  const handleNotificationClick = (notification) => {
    console.log('Notification clicked:', notification);
    
    // First mark the notification as read
    markAsRead(notification.id);
    
    // Close the popover
    setVisible(false);
    
    // If we have an onNewNotification handler (provided by Header.jsx),
    // pass the notification to it for handling navigation
    if (onNewNotification && typeof onNewNotification === 'function') {
      console.log('Calling onNewNotification handler');
      onNewNotification(notification);
    }
  };

  // Render notification list item with detailed info
  const renderNotificationItem = (notification) => (
    <List.Item
      style={{
        padding: '12px 16px',
        cursor: 'pointer',
        backgroundColor: notification.status === 'unread' ? '#f6ffed' : 'transparent'
      }}
      onClick={() => handleNotificationClick(notification)}
    >
      <List.Item.Meta
        title={
          <Space>
            <Text strong>{notification.title || 'No Title'}</Text>
            {notification.status === 'unread' && (
              <Badge status="processing" />
            )}
          </Space>
        }
        description={
          <>
            <Text type="secondary">{notification.message || 'No Message'}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {notification.created_at ? dayjs(notification.created_at).fromNow() : 'Unknown time'}
            </Text>
            {debugMode && (
              <>
                <br />
                <Text type="secondary" style={{ fontSize: '10px' }}>
                  ID: {notification.id || 'No ID'} | Type: {notification.notification_type || 'No Type'}
                </Text>
              </>
            )}
          </>
        }
      />
    </List.Item>
  );

  // Test function to debug mark as read functionality
  const testMarkNotificationAsRead = async () => {
    try {
      // Find the first unread notification
      const unreadNotification = notifications.find(n => n.status === 'unread');
      
      if (!unreadNotification) {
        message.info('No unread notifications to test with');
        console.log('No unread notifications available for testing');
        return;
      }
      
      console.log('Testing mark as read with notification:', unreadNotification);
      
      // Method 1: Try with API client
      try {
        console.log('Method 1: Using API client');
        const url = `/notifications/${unreadNotification.id}/mark-as-read/`;
        console.log('Using URL:', url);
        
        const response = await api.post(url);
        console.log('API response:', response);
        
        message.success('Method 1 succeeded!');
        console.log('Method 1 succeeded. Notification should now be marked as read.');
        
        // Update UI
        setNotifications(prev => 
          prev.map(n => n.id === unreadNotification.id 
            ? {...n, status: 'read', read_at: new Date().toISOString()} 
            : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        
        // Refresh after a short delay
        setTimeout(() => {
          fetchNotificationsWithFallbacks();
        }, 1000);
        
        return;
      } catch (error) {
        console.error('Method 1 failed:', error);
        message.error('Method 1 failed, trying method 2...');
      }
      
      // Method 2: Try with direct fetch
      try {
        console.log('Method 2: Using direct fetch');
        const token = localStorage.getItem('token');
        
        const url = `${api.defaults.baseURL}/notifications/${unreadNotification.id}/mark-as-read/`;
        console.log('Using URL:', url);
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });
        
        if (!response.ok) {
          throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Fetch response:', data);
        
        message.success('Method 2 succeeded!');
        console.log('Method 2 succeeded. Notification should now be marked as read.');
        
        // Update UI
        setNotifications(prev => 
          prev.map(n => n.id === unreadNotification.id 
            ? {...n, status: 'read', read_at: new Date().toISOString()} 
            : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        
        // Refresh after a short delay
        setTimeout(() => {
          fetchNotificationsWithFallbacks();
        }, 1000);
        
        return;
      } catch (error) {
        console.error('Method 2 failed:', error);
        message.error('Method 2 failed. All attempts failed.');
        
        // Just update UI for testing
        console.log('Updating UI state locally for testing purposes');
        setNotifications(prev => 
          prev.map(n => n.id === unreadNotification.id 
            ? {...n, status: 'read', read_at: new Date().toISOString()} 
            : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error in test function:', error);
      message.error('Test function encountered an error');
    }
  };

  const notificationContent = (
    <div style={{ width: 350, maxHeight: 400, overflowY: 'auto' }}>
      <div style={{ padding: '8px 16px', borderBottom: '1px solid #f0f0f0' }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Text strong>Notifications ({unreadCount})</Text>
          {unreadCount > 0 && (
            <Button type="link" onClick={markAllAsRead}>
              Mark all as read
            </Button>
          )}
        </Space>
      </div>
      
      {/* Add this test button in normal mode */}
      <div style={{ padding: '8px 16px', borderBottom: '1px solid #f0f0f0', backgroundColor: '#f6f7f8' }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Text>Debug Tools</Text>
          <Button size="small" onClick={testMarkNotificationAsRead}>
            Test Mark as Read
          </Button>
          <Button size="small" onClick={fetchNotificationsWithFallbacks}>
            Refresh
          </Button>
        </Space>
      </div>
      
      {debugMode && (
        <div style={{ padding: '8px 16px', borderBottom: '1px solid #f0f0f0', backgroundColor: '#f6f7f8' }}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Button size="small" onClick={testNotificationsApi} icon={<BugOutlined />}>
              Test Create Notification API
            </Button>
            <Button size="small" onClick={debugNotificationPaths} icon={<BugOutlined />}>
              Debug API Paths
            </Button>
            <Button size="small" onClick={testDirectAPI} icon={<BugOutlined />}>
              Test Direct API Access
            </Button>
            <Button size="small" onClick={checkApiConfig}>
              Check Config
            </Button>
            {apiTestResult && (
              <div style={{ fontSize: '10px', overflowX: 'auto' }}>
                <pre>{JSON.stringify(apiTestResult, null, 2)}</pre>
              </div>
            )}
          </Space>
        </div>
      )}
      
      {loading ? (
        <div style={{ padding: 24, textAlign: 'center' }}>
          <Spin />
        </div>
      ) : notifications.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={unreadCount > 0 ? "Error loading notifications" : "No notifications"}
          style={{ padding: 24 }}
        >
          {unreadCount > 0 && (
            <Button 
              type="primary" 
              size="small" 
              onClick={() => fetchNotificationsWithFallbacks()}
            >
              Retry
            </Button>
          )}
        </Empty>
      ) : (
        <List
          itemLayout="horizontal"
          dataSource={notifications}
          renderItem={renderNotificationItem}
        />
      )}
    </div>
  );

  const debugContent = (
    <div style={{ width: 450, maxHeight: 400, overflowY: 'auto' }}>
      <div style={{ padding: '8px 16px', borderBottom: '1px solid #f0f0f0' }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Text strong>API Debug Tool</Text>
        </Space>
      </div>
      
      {loading ? (
        <div style={{ padding: 24, textAlign: 'center' }}>
          <Spin />
        </div>
      ) : (
        <div style={{ padding: 16 }}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Button size="small" onClick={testNotificationsApi} icon={<BugOutlined />}>
              Test Create Notification API
            </Button>
            <Button size="small" onClick={debugNotificationPaths} icon={<BugOutlined />}>
              Debug API Paths
            </Button>
            <Button size="small" onClick={checkApiConfig}>
              Check Config
            </Button>
            {apiTestResult && (
              <div style={{ fontSize: '10px', overflowX: 'auto' }}>
                <pre>{JSON.stringify(apiTestResult, null, 2)}</pre>
              </div>
            )}
          </Space>
        </div>
      )}
    </div>
  );

  return (
    <div className="notification-center" onClick={(e) => e.stopPropagation()}>
      <Popover 
        content={notificationContent}
        title={<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Notifications</span>
          <div>
            <Tooltip title="Refresh notifications">
              <Button 
                type="text" 
                size="small" 
                icon={<SyncOutlined />}
                onClick={(e) => {
                  if (e) {
                    e.stopPropagation();
                    e.preventDefault();
                  }
                  console.log('Manually refreshing notifications');
                  fetchNotificationsWithFallbacks();
                }}
                style={{ marginRight: 4 }}
              />
            </Tooltip>
            <Tooltip title="Toggle debug mode">
              <Button 
                type="text" 
                size="small" 
                icon={<BugOutlined style={{ color: debugMode ? '#1890ff' : undefined }} />} 
                onClick={(e) => {
                  if (e) {
                    e.stopPropagation();
                    e.preventDefault();
                  }
                  toggleDebugMode();
                }}
              />
            </Tooltip>
          </div>
        </div>}
        trigger="click"
        placement="bottomRight"
        overlayStyle={{ width: debugMode ? '450px' : '350px' }}
        open={visible}
        onOpenChange={(newVisible) => {
          console.log('Popover visibility changing to:', newVisible);
          if (newVisible) {
            // Force refresh notifications when opening
            fetchNotificationsWithFallbacks();
          }
          setVisible(newVisible);
        }}
      >
        <Badge 
          count={unreadCount} 
          size="small"
        >
          <BellOutlined 
            style={{ fontSize: '16px', cursor: 'pointer' }} 
            onClick={(e) => {
              console.log('Bell icon clicked');
              if (e) {
                e.stopPropagation();
                e.preventDefault();
              }
              // First explicitly set visible to true and force a refresh
              setVisible(true);
              fetchNotificationsWithFallbacks();
              toggleVisible(e);
            }}
          />
        </Badge>
      </Popover>
      
      {/* Debug info always in DOM but hidden unless debug mode is on */}
      <div style={{ display: 'none', position: 'fixed', bottom: 10, right: 10, zIndex: 9999, padding: 10, background: '#fff', border: '1px solid #ccc', maxWidth: 300, maxHeight: 200, overflow: 'auto' }}>
        <pre>
          {JSON.stringify({
            visible,
            unreadCount,
            notificationsCount: notifications.length,
            hasData: notifications.length > 0,
            notificationSample: notifications.length > 0 ? notifications[0] : null,
            userId: localStorage.getItem('user_id'),
            tenantId: localStorage.getItem('tenant_id')
          }, null, 2)}
        </pre>
      </div>
      
      {debugMode && (
        <Popover
          content={debugContent}
          title="API Debug Tool"
          trigger="click"
          placement="bottomRight"
          overlayStyle={{ width: '450px' }}
        >
          <Button 
            type="primary" 
            size="small" 
            icon={<BugOutlined />} 
            style={{ marginLeft: '8px' }}
          />
        </Popover>
      )}
    </div>
  );
};

export default NotificationCenter; 