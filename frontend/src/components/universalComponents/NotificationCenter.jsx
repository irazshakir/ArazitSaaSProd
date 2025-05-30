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
  const [notificationSound] = useState(new Audio('/notification-bell.mp3'));

  // Toggle the visibility of the popover
  const toggleVisible = (event) => {
    if (event && event.nativeEvent && typeof event.stopPropagation === 'function') {
      event.stopPropagation();
    } else if (event && typeof event.stopPropagation === 'function') {
      event.stopPropagation();
    }
    
    const newVisibleState = !visible;
    
    if (newVisibleState) {
      fetchNotificationsWithFallbacks();
    }
    
    if (onClick && typeof onClick === 'function') {
      onClick(event && event.nativeEvent ? event : event || null);
    } else {
      setVisible(newVisibleState);
      setAnchorEl(event?.currentTarget || null);
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      const userId = localStorage.getItem('user_id');
      const tenantId = localStorage.getItem('tenant_id');
      const token = localStorage.getItem('token');
      
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
      
      let notificationsData = [];
      if (response.data && Array.isArray(response.data)) {
        notificationsData = response.data;
      } else if (response.data && Array.isArray(response.data.results)) {
        notificationsData = response.data.results;
      } else if (response.data && typeof response.data === 'object') {
        if (Array.isArray(response.data.data)) {
          notificationsData = response.data.data;
        } else {
          const possibleArrays = Object.values(response.data).filter(val => Array.isArray(val));
          if (possibleArrays.length > 0) {
            notificationsData = possibleArrays[0];
          }
        }
      }
      
      const countResponse = await api.get('/notifications/unread-count/', {
        headers: token ? {
          'Authorization': `Bearer ${token}`
        } : undefined
      });
      const unreadCount = countResponse.data.count || 0;
      setUnreadCount(unreadCount);
      
      if (notificationsData && notificationsData.length > 0) {
        const newestNotification = notificationsData[0];
        
        if (lastNotificationId === null) {
          setLastNotificationId(newestNotification.id);
        } 
        else if (lastNotificationId !== newestNotification.id) {
          if (onNewNotification && newestNotification.status === 'unread') {
            onNewNotification(newestNotification);
          }
          setLastNotificationId(newestNotification.id);
        }
        
        setNotifications(notificationsData);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      if (!notificationId) {
        return false;
      }
      
      message.loading({ content: 'Marking notification as read...', key: 'markRead' });
      
      const url = `/notifications/${notificationId}/mark-as-read/`;
      
      const response = await api.post(url);
      
      setNotifications(prevNotifications =>
        prevNotifications.map(notification =>
          notification.id === notificationId
            ? { ...notification, status: 'read', read_at: new Date().toISOString() }
            : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      message.success({ content: 'Notification marked as read', key: 'markRead' });
      
      setTimeout(() => {
        fetchNotificationsWithFallbacks();
      }, 1000);
      
      return true;
    } catch (error) {
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
      
      const url = `/notifications/mark-all-as-read/`;
      
      const response = await api.post(url);
      
      setNotifications(prevNotifications =>
        prevNotifications.map(notification => ({
          ...notification,
          status: 'read',
          read_at: new Date().toISOString()
        }))
      );
      setUnreadCount(0);
      
      message.success({ content: 'All notifications marked as read', key: 'markAllRead' });
      
      setTimeout(() => {
        fetchNotificationsWithFallbacks();
      }, 500);
      
      return true;
    } catch (error) {
      message.error({ 
        content: 'Failed to mark notifications as read. Please try again.', 
        key: 'markAllRead'
      });
      
      return false;
    }
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
      await fetchNotifications();
      
      if (notifications.length === 0 && unreadCount > 0) {
        await testDirectAPI();
      }
    } catch (error) {
      // Silent fail
    }
  };

  // Load notifications on component mount and every 30 seconds
  useEffect(() => {
    fetchNotificationsWithFallbacks();
    
    const interval = setInterval(() => {
      fetchNotificationsWithFallbacks();
    }, 30000);
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    setVisible(false);
    
    if (onNewNotification && typeof onNewNotification === 'function') {
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
          </>
        }
      />
    </List.Item>
  );

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

  return (
    <div className="notification-center" onClick={(e) => e.stopPropagation()}>
      <Popover 
        content={notificationContent}
        title={<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Notifications</span>
        </div>}
        trigger="click"
        placement="bottomRight"
        overlayStyle={{ width: '350px' }}
        open={visible}
        onOpenChange={(newVisible) => {
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
    </div>
  );
};

export default NotificationCenter; 