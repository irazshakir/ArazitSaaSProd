import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Typography, 
  Breadcrumb, 
  Spin, 
  Alert, 
  Space, 
  Tabs, 
  Button, 
  Descriptions, 
  Tag 
} from 'antd';
import { 
  HomeOutlined, 
  EditOutlined, 
  PhoneOutlined, 
  MailOutlined, 
  WhatsAppOutlined 
} from '@ant-design/icons';
import { Box, Container, Paper, Grid, Divider } from '@mui/material';
import api from '../../services/api';

// Import lead components
import LeadNotes from './components/leadNotes';
import LeadActivities from './components/leadActivities';
import LeadDocuments from './components/leadDocuments';
import LeadStatusBadge from './components/leadStatusBadge';

const { TabPane } = Tabs;

/**
 * Component for viewing lead details
 */
const LeadView = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [leadData, setLeadData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Fetch lead data
  useEffect(() => {
    const fetchLead = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/leads/${id}/`);
        setLeadData(response.data);
      } catch (err) {
        console.error('Error fetching lead:', err);
        setError('Failed to load lead details. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchLead();
    }
  }, [id]);
  
  // Handle tab change
  const handleTabChange = (key) => {
    setActiveTab(key);
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };
  
  // Show loading state
  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ pt: 2, pb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <Spin size="large" />
        </Box>
      </Container>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <Container maxWidth="xl" sx={{ pt: 2, pb: 4 }}>
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          action={
            <Space>
              <Button type="primary" onClick={() => navigate('/dashboard/leads')}>
                Back to Leads
              </Button>
            </Space>
          }
        />
      </Container>
    );
  }
  
  return (
    <Container maxWidth="xl" sx={{ pt: 2, pb: 4 }}>
      {/* Breadcrumbs navigation */}
      <Breadcrumb 
        style={{ marginBottom: '16px' }}
        items={[
          {
            title: <span onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}><HomeOutlined /> Dashboard</span>,
          },
          {
            title: <span onClick={() => navigate('/dashboard/leads')} style={{ cursor: 'pointer' }}>Leads</span>,
          },
          {
            title: leadData?.name || 'Lead Details',
          },
        ]}
      />
      
      {/* Lead Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography.Title level={3} style={{ marginBottom: '8px' }}>
              {leadData?.name}
            </Typography.Title>
            <Space size="middle">
              <LeadStatusBadge status={leadData?.status} />
              <Tag color="blue">{leadData?.lead_type_display}</Tag>
              <Tag color="purple">{leadData?.source_display}</Tag>
            </Space>
          </Box>
          <Button 
            type="primary" 
            icon={<EditOutlined />} 
            onClick={() => navigate(`/dashboard/leads/${id}/edit`)}
          >
            Edit Lead
          </Button>
        </Box>
        
        <Divider />
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Typography.Text type="secondary">Contact Information</Typography.Text>
              <Box sx={{ display: 'flex', flexDirection: 'column', mt: 1 }}>
                {leadData?.phone && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <PhoneOutlined style={{ marginRight: 8 }} />
                    <Typography.Text>{leadData.phone}</Typography.Text>
                  </Box>
                )}
                {leadData?.email && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <MailOutlined style={{ marginRight: 8 }} />
                    <Typography.Text>{leadData.email}</Typography.Text>
                  </Box>
                )}
                {leadData?.whatsapp && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <WhatsAppOutlined style={{ marginRight: 8 }} />
                    <Typography.Text>{leadData.whatsapp}</Typography.Text>
                  </Box>
                )}
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Typography.Text type="secondary">Lead Details</Typography.Text>
              <Descriptions column={1} size="small" style={{ marginTop: 8 }}>
                <Descriptions.Item label="Created On">{formatDate(leadData?.created_at)}</Descriptions.Item>
                <Descriptions.Item label="Last Updated">{formatDate(leadData?.updated_at)}</Descriptions.Item>
                <Descriptions.Item label="Last Contacted">{formatDate(leadData?.last_contacted)}</Descriptions.Item>
                <Descriptions.Item label="Next Follow-up">{formatDate(leadData?.next_follow_up)}</Descriptions.Item>
              </Descriptions>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Tabs for different sections */}
      <Paper sx={{ p: 3 }}>
        <Tabs activeKey={activeTab} onChange={handleTabChange}>
          <TabPane tab="Overview" key="overview">
            <Box sx={{ py: 2 }}>
              <Typography.Title level={5}>Lead Information</Typography.Title>
              <Descriptions bordered column={{ xs: 1, sm: 2 }}>
                <Descriptions.Item label="Lead Type">{leadData?.lead_type_display}</Descriptions.Item>
                <Descriptions.Item label="Lead Source">{leadData?.source_display}</Descriptions.Item>
                <Descriptions.Item label="Status">{leadData?.status_display}</Descriptions.Item>
                <Descriptions.Item label="Activity Status">{leadData?.lead_activity_status === 'active' ? 'Active' : 'Inactive'}</Descriptions.Item>
                <Descriptions.Item label="Created By">{leadData?.created_by_details?.email || 'N/A'}</Descriptions.Item>
                <Descriptions.Item label="Assigned To">{leadData?.assigned_to_details?.email || 'Not Assigned'}</Descriptions.Item>
              </Descriptions>
              
              {leadData?.query_for && (
                <Box sx={{ mt: 3 }}>
                  <Typography.Title level={5}>Query Details</Typography.Title>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                      {typeof leadData.query_for === 'object' 
                        ? JSON.stringify(leadData.query_for, null, 2)
                        : leadData.query_for}
                    </pre>
                  </Paper>
                </Box>
              )}
            </Box>
          </TabPane>
          
          <TabPane tab="Notes" key="notes">
            <LeadNotes leadId={id} notes={leadData?.notes || []} />
          </TabPane>
          
          <TabPane tab="Activities" key="activities">
            <LeadActivities leadId={id} activities={leadData?.activities || []} />
          </TabPane>
          
          <TabPane tab="Documents" key="documents">
            <LeadDocuments leadId={id} documents={leadData?.documents || []} />
          </TabPane>
          
          <TabPane tab="Timeline" key="timeline">
            <Box sx={{ py: 2 }}>
              <Typography.Title level={5}>Lead Timeline</Typography.Title>
              {leadData?.events && leadData.events.length > 0 ? (
                <Timeline>
                  {leadData.events.map((event) => (
                    <Timeline.Item key={event.id}>
                      <Typography.Text strong>{event.event_type_display}</Typography.Text>
                      <Typography.Text> - {new Date(event.timestamp).toLocaleString()}</Typography.Text>
                      <Typography.Text type="secondary"> by {event.updated_by_details?.email || 'System'}</Typography.Text>
                    </Timeline.Item>
                  ))}
                </Timeline>
              ) : (
                <Alert message="No timeline events found" type="info" />
              )}
            </Box>
          </TabPane>
        </Tabs>
      </Paper>
    </Container>
  );
};

export default LeadView;
