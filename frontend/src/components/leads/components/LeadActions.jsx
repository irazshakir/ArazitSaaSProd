import React, { useState } from 'react';
import { Dropdown, Button, Modal, Select, Form, message, Tooltip } from 'antd';
import { MoreOutlined, UserOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import leadService from '../../../services/leadService';

const LeadActions = ({ record, onRefresh }) => {
  const navigate = useNavigate();
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [userList, setUserList] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  
  // Function to fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const tenantId = localStorage.getItem('tenant_id');
      const response = await api.get(`/auth/active-by-tenant/?tenant=${tenantId}`);
      
      // Process users into options for the select dropdown
      const users = response.data.map(user => ({
        value: user.id,
        label: `${user.first_name} ${user.last_name} (${user.email})`,
        department: user.department_name || 'Other'
      }));
      
      // Group users by department
      const usersByDepartment = {};
      users.forEach(user => {
        if (!usersByDepartment[user.department]) {
          usersByDepartment[user.department] = [];
        }
        usersByDepartment[user.department].push({
          value: user.value,
          label: user.label
        });
      });
      
      // Convert to options format
      const options = Object.keys(usersByDepartment).map(dept => ({
        label: dept,
        options: usersByDepartment[dept]
      }));
      
      setUserList(options);
    } catch (error) {
      message.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };
  
  // Function to assign lead
  const handleAssign = async () => {
    try {
      if (!selectedUser) {
        message.error('Please select a user to assign');
        return;
      }
      
      setLoading(true);
      
      // Determine if this is an assignment or a transfer
      const isTransfer = record.assigned_to && record.assigned_to !== selectedUser;
      
      if (isTransfer) {
        // Call transferLead to handle notification creation
        await leadService.transferLead(
          record.id, 
          selectedUser, 
          record.assigned_to, 
          { name: record.name }
        );
        message.success('Lead transferred successfully');
      } else {
        // Call assignLead to handle notification creation
        await leadService.assignLead(
          record.id, 
          selectedUser, 
          { name: record.name }
        );
        message.success('Lead assigned successfully');
      }
      
      setAssignModalVisible(false);
      setSelectedUser(null);
      form.resetFields();
      
      // Refresh the leads list
      if (onRefresh) onRefresh();
    } catch (error) {
      message.error('Failed to assign lead');
    } finally {
      setLoading(false);
    }
  };
  
  // Function to delete lead
  const handleDelete = async () => {
    try {
      setLoading(true);
      await api.delete(`/leads/${record.id}/`);
      message.success('Lead deleted successfully');
      setDeleteModalVisible(false);
      
      // Refresh the leads list
      if (onRefresh) onRefresh();
    } catch (error) {
      message.error('Failed to delete lead');
    } finally {
      setLoading(false);
    }
  };
  
  // Edit lead
  const handleEdit = () => {
    navigate(`/dashboard/leads/edit/${record.id}`);
  };
  
  // Menu items
  const items = [
    {
      key: 'edit',
      label: 'Edit Lead',
      icon: <EditOutlined />,
      onClick: handleEdit
    },
    {
      key: 'assign',
      label: 'Assign Lead',
      icon: <UserOutlined />,
      onClick: () => {
        fetchUsers();
        setAssignModalVisible(true);
      }
    },
    {
      key: 'delete',
      label: 'Delete Lead',
      icon: <DeleteOutlined />,
      onClick: () => setDeleteModalVisible(true),
      danger: true
    }
  ];
  
  return (
    <>
      <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
        <Button type="text" icon={<MoreOutlined />} />
      </Dropdown>
      
      {/* Assign Modal */}
      <Modal
        title="Assign Lead"
        open={assignModalVisible}
        onCancel={() => {
          setAssignModalVisible(false);
          setSelectedUser(null);
          form.resetFields();
        }}
        onOk={handleAssign}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="user"
            label="Select User"
            rules={[{ required: true, message: 'Please select a user' }]}
          >
            <Select
              placeholder="Select user to assign"
              options={userList}
              loading={loading}
              onChange={value => setSelectedUser(value)}
              showSearch
              filterOption={(input, option) => 
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>
        </Form>
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal
        title="Delete Lead"
        open={deleteModalVisible}
        onCancel={() => setDeleteModalVisible(false)}
        onOk={handleDelete}
        confirmLoading={loading}
        okText="Delete"
        okButtonProps={{ danger: true }}
      >
        <p>Are you sure you want to delete this lead? This action cannot be undone.</p>
      </Modal>
    </>
  );
};

export default LeadActions; 