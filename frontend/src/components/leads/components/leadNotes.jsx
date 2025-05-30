import React, { useState, useEffect } from 'react';
import { 
  List, 
  Avatar, 
  Button, 
  Input, 
  Form, 
  Card, 
  Typography, 
  Divider, 
  Space, 
  Empty, 
  message 
} from 'antd';
import { UserOutlined, SendOutlined, DeleteOutlined } from '@ant-design/icons';
import { Box } from '@mui/material';
import api from '../../../services/api';

const { TextArea } = Input;

/**
 * Component for displaying and managing lead notes
 * @param {string} leadId - The ID of the lead
 * @param {array} notes - Initial notes data
 */
const LeadNotes = ({ leadId, notes = [] }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [leadNotes, setLeadNotes] = useState(notes);
  
  // Fetch notes if not provided
  useEffect(() => {
    if (!notes || notes.length === 0) {
      fetchNotes();
    } else {
      setLeadNotes(notes);
    }
  }, [notes, leadId]);
  
  // Fetch notes from API
  const fetchNotes = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/lead-notes/?lead=${leadId}`);
      
      // Process response data
      let notesArray = Array.isArray(response.data) 
        ? response.data
        : (response.data?.results && Array.isArray(response.data.results))
          ? response.data.results
          : [];
      
      setLeadNotes(notesArray);
    } catch (error) {
      message.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  };
  
  // Add a new note
  const handleAddNote = async (values) => {
    try {
      setSubmitting(true);
      
      const response = await api.post('/leads/' + leadId + '/add-note/', {
        note: values.note,
        lead: leadId
      });
      
      // Add new note to the list
      setLeadNotes([response.data, ...leadNotes]);
      
      // Reset form
      form.resetFields();
      
      message.success('Note added successfully');
    } catch (error) {
      message.error('Failed to add note');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Delete a note
  const handleDeleteNote = async (noteId) => {
    try {
      await api.delete(`/lead-notes/${noteId}/`);
      
      // Remove note from the list
      setLeadNotes(leadNotes.filter(note => note.id !== noteId));
      
      message.success('Note deleted successfully');
    } catch (error) {
      message.error('Failed to delete note');
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString();
  };
  
  return (
    <Box sx={{ py: 2 }}>
      {/* Add Note Form */}
      <Card title="Add Note" style={{ marginBottom: 16 }}>
        <Form form={form} onFinish={handleAddNote} layout="vertical">
          <Form.Item
            name="note"
            rules={[{ required: true, message: 'Please enter a note' }]}
          >
            <TextArea 
              rows={4} 
              placeholder="Enter your note here..." 
              maxLength={1000} 
              showCount 
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              icon={<SendOutlined />} 
              loading={submitting}
            >
              Add Note
            </Button>
          </Form.Item>
        </Form>
      </Card>
      
      {/* Notes List */}
      <Card title="Notes History" loading={loading}>
        {leadNotes && leadNotes.length > 0 ? (
          <List
            itemLayout="vertical"
            dataSource={leadNotes}
            renderItem={note => (
              <List.Item
                key={note.id}
                actions={[
                  <Button 
                    type="text" 
                    danger 
                    icon={<DeleteOutlined />} 
                    onClick={() => handleDeleteNote(note.id)}
                  >
                    Delete
                  </Button>
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar icon={<UserOutlined />} src={note.added_by_details?.profile_picture} />
                  }
                  title={
                    <Space>
                      <Typography.Text strong>
                        {note.added_by_details?.first_name 
                          ? `${note.added_by_details.first_name} ${note.added_by_details.last_name || ''}`
                          : note.added_by_details?.email || 'User'}
                      </Typography.Text>
                      <Typography.Text type="secondary" style={{ fontSize: '0.8rem' }}>
                        {formatDate(note.timestamp)}
                      </Typography.Text>
                    </Space>
                  }
                  description={note.note}
                />
              </List.Item>
            )}
          />
        ) : (
          <Empty description="No notes found" />
        )}
      </Card>
    </Box>
  );
};

export default LeadNotes;
