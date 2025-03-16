import React, { useState, useEffect } from 'react';
import { 
  List, 
  Button, 
  Upload, 
  Form, 
  Card, 
  Typography, 
  Space, 
  Empty, 
  message,
  Input,
  Tooltip,
  Modal,
  Tag,
  Row,
  Col,
  Divider
} from 'antd';
import { 
  UploadOutlined, 
  FileOutlined, 
  FilePdfOutlined, 
  FileImageOutlined, 
  FileTextOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EyeOutlined,
  PlusOutlined,
  MinusCircleOutlined
} from '@ant-design/icons';
import { Box } from '@mui/material';
import api from '../../../services/api';

const { Dragger } = Upload;

/**
 * Component for displaying and managing lead documents
 * @param {string} leadId - The ID of the lead
 * @param {array} documents - Initial documents data
 * @param {function} onDocumentUpload - Callback function to refresh documents in parent component
 */
const LeadDocuments = ({ leadId, documents = [], onDocumentUpload }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [leadDocuments, setLeadDocuments] = useState(documents);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewDocument, setPreviewDocument] = useState(null);
  
  // Document type options based on the model
  const documentTypes = [
    { value: 'passport', label: 'Passport' },
    { value: 'picture', label: 'Picture' },
    { value: 'visa', label: 'Visa' },
    { value: 'makkah_hotel_voucher', label: 'Makkah Hotel Voucher' },
    { value: 'madinah_hotel_voucher', label: 'Madinah Hotel Voucher' },
    { value: 'transfer_voucher', label: 'Transfer Voucher' },
    { value: 'ziyarat_voucher', label: 'Ziyarat Voucher' },
    { value: 'flight_ticket', label: 'Flight Ticket' },
    { value: 'other', label: 'Other' }
  ];
  
  // Fetch documents if not provided
  useEffect(() => {
    if (leadId) {
      if (!documents || documents.length === 0) {
        fetchDocuments();
      } else {
        setLeadDocuments(documents);
      }
    } else {
      console.error('No lead ID provided to LeadDocuments component');
    }
  }, [documents, leadId]);
  
  // Fetch documents from API
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      
      if (!leadId) {
        console.error('Cannot fetch documents: No lead ID provided');
        setLoading(false);
        return;
      }
      
      console.log(`Fetching documents for lead: ${leadId}`);
      const response = await api.get(`/lead-documents/?lead=${leadId}`);
      
      // Process response data
      let documentsArray = Array.isArray(response.data) 
        ? response.data
        : (response.data?.results && Array.isArray(response.data.results))
          ? response.data.results
          : [];
      
      console.log(`Retrieved ${documentsArray.length} documents for lead ${leadId}`);
      setLeadDocuments(documentsArray);
    } catch (error) {
      console.error('Error fetching documents:', error);
      message.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };
  
  // Custom file upload props
  const uploadProps = {
    beforeUpload: (file) => {
      // Prevent automatic upload
      return false;
    },
    maxCount: 1,
    multiple: false,
    showUploadList: false // Hide the default upload list
  };
  
  // Handle form submission with multiple documents
  const handleUpload = async (values, event) => {
    // If event is available, prevent default behavior
    if (event && event.preventDefault) {
      event.preventDefault();
    }
    
    try {
      setSubmitting(true);
      
      // Get tenant ID from localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const tenantId = user.tenant_id;
      
      if (!tenantId) {
        console.error('Tenant ID not found in localStorage');
        message.error('Tenant information not available. Please log in again.');
        setSubmitting(false);
        return;
      }
      
      console.log('Starting document upload with values:', values);
      
      // Process each document in the documents array
      const uploadPromises = values.documents.map(async (doc, index) => {
        // Skip if no file is selected or no name is provided
        if (!doc.document_path || !doc.document_path[0] || !doc.document_name) {
          console.log(`Skipping document ${index} due to missing data:`, doc);
          return null;
        }
        
        console.log(`Preparing to upload document ${index}:`, {
          name: doc.document_name,
          file: doc.document_path[0].name
        });
        
        const formData = new FormData();
        formData.append('document_name', doc.document_name);
        formData.append('lead', leadId);
        formData.append('tenant', tenantId);
        formData.append('document_path', doc.document_path[0].originFileObj);
        
        // Use the correct endpoint from urls.py
        return api.post(`/leads/${leadId}/upload-document/`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      });
      
      // Filter out null promises (skipped uploads)
      const validPromises = uploadPromises.filter(p => p !== null);
      
      if (validPromises.length === 0) {
        console.warn('No valid documents to upload');
        message.warning('No valid documents to upload');
        setSubmitting(false);
        return;
      }
      
      console.log(`Attempting to upload ${validPromises.length} documents`);
      
      // Wait for all uploads to complete
      const responses = await Promise.all(validPromises);
      console.log('Upload responses:', responses);
      
      // Add new documents to the list
      const newDocuments = responses.map(response => response.data);
      setLeadDocuments([...newDocuments, ...leadDocuments]);
      
      // Reset form
      form.resetFields();
      
      // Call the onDocumentUpload callback to refresh documents in parent component
      if (onDocumentUpload && typeof onDocumentUpload === 'function') {
        console.log('Calling onDocumentUpload callback');
        onDocumentUpload(leadId);
      }
      
      message.success(`${newDocuments.length} document(s) uploaded successfully`);
    } catch (error) {
      console.error('Error uploading documents:', error);
      message.error('Failed to upload documents: ' + (error.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };
  
  // Delete a document
  const handleDeleteDocument = async (documentId) => {
    try {
      await api.delete(`/lead-documents/${documentId}/`);
      
      // Remove document from the list
      setLeadDocuments(leadDocuments.filter(doc => doc.id !== documentId));
      
      message.success('Document deleted successfully');
    } catch (error) {
      console.error('Error deleting document:', error);
      message.error('Failed to delete document');
    }
  };
  
  // Preview a document
  const handlePreviewDocument = (document) => {
    setPreviewDocument(document);
    setPreviewVisible(true);
  };
  
  // Close preview modal
  const handleClosePreview = () => {
    setPreviewVisible(false);
    setPreviewDocument(null);
  };
  
  // Download a document
  const handleDownloadDocument = (document) => {
    // Create a link and trigger download
    const link = document.document_path;
    if (link) {
      const a = document.createElement('a');
      a.href = link;
      a.download = getDocumentFileName(document);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      message.error('Download link not available');
    }
  };
  
  // Get document file name from path
  const getDocumentFileName = (document) => {
    if (!document.document_path) return 'document';
    
    // Extract filename from path
    const pathParts = document.document_path.split('/');
    return pathParts[pathParts.length - 1];
  };
  
  // Get document type label
  const getDocumentTypeLabel = (type) => {
    const docType = documentTypes.find(t => t.value === type);
    return docType ? docType.label : type;
  };
  
  // Get icon based on document type
  const getDocumentIcon = (document) => {
    const fileName = document.document_path?.toLowerCase() || '';
    
    if (fileName.endsWith('.pdf')) {
      return <FilePdfOutlined style={{ fontSize: '24px', color: '#f5222d' }} />;
    } else if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.png') || fileName.endsWith('.gif')) {
      return <FileImageOutlined style={{ fontSize: '24px', color: '#1890ff' }} />;
    } else if (fileName.endsWith('.doc') || fileName.endsWith('.docx') || fileName.endsWith('.txt')) {
      return <FileTextOutlined style={{ fontSize: '24px', color: '#52c41a' }} />;
    } else {
      return <FileOutlined style={{ fontSize: '24px', color: '#faad14' }} />;
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString();
  };
  
  return (
    <Box sx={{ py: 2 }}>
      {/* Upload Document Form - Redesigned */}
      <Card title="Upload Documents" style={{ marginBottom: 16 }}>
        <Form 
          form={form} 
          onFinish={handleUpload} 
          layout="vertical"
          onSubmit={(e) => e.preventDefault()}
        >
          <Form.List name="documents" initialValue={[{}]}>
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Row key={key} gutter={16} align="middle" style={{ marginBottom: 16 }}>
                    <Col span={12}>
                      <Form.Item
                        {...restField}
                        name={[name, 'document_name']}
                        rules={[{ required: true, message: 'Document name is required' }]}
                        style={{ marginBottom: 0 }}
                      >
                        <Input placeholder="Document name or description" />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        {...restField}
                        name={[name, 'document_path']}
                        valuePropName="fileList"
                        getValueFromEvent={e => Array.isArray(e) ? e : e?.fileList}
                        rules={[{ required: true, message: 'Please select a file' }]}
                        style={{ marginBottom: 0 }}
                      >
                        <Upload {...uploadProps}>
                          <Button icon={<UploadOutlined />}>Select File</Button>
                        </Upload>
                      </Form.Item>
                    </Col>
                    <Col span={4} style={{ textAlign: 'right' }}>
                      <Space>
                        {fields.length > 1 && (
                          <Button 
                            type="text" 
                            danger
                            icon={<MinusCircleOutlined />} 
                            onClick={() => remove(name)} 
                          />
                        )}
                        {key === fields.length - 1 && (
                          <Button 
                            type="text" 
                            icon={<PlusOutlined />} 
                            onClick={() => add()} 
                          />
                        )}
                      </Space>
                    </Col>
                    
                    {/* Show selected file name */}
                    <Col span={24}>
                      <Form.Item
                        shouldUpdate={(prevValues, currentValues) => {
                          return prevValues.documents?.[name]?.document_path !== 
                                 currentValues.documents?.[name]?.document_path;
                        }}
                        style={{ marginBottom: 0, marginTop: 4 }}
                      >
                        {({ getFieldValue }) => {
                          const fileList = getFieldValue(['documents', name, 'document_path']);
                          const fileName = fileList && fileList[0]?.name;
                          return fileName ? (
                            <Typography.Text type="secondary" style={{ fontSize: '0.8rem' }}>
                              Selected: {fileName}
                            </Typography.Text>
                          ) : null;
                        }}
                      </Form.Item>
                    </Col>
                  </Row>
                ))}
                
                <Divider style={{ margin: '16px 0' }} />
                
                <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    icon={<UploadOutlined />} 
                    loading={submitting}
                    onClick={(e) => {
                      e.preventDefault(); // Prevent default button behavior
                      form.validateFields().then(values => {
                        handleUpload(values, e);
                      }).catch(err => {
                        console.error('Validation failed:', err);
                      });
                    }}
                  >
                    Upload All Documents
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </Form>
      </Card>
      
      {/* Documents List */}
      <Card title="Documents" loading={loading}>
        {leadDocuments && leadDocuments.length > 0 ? (
          <List
            itemLayout="horizontal"
            dataSource={leadDocuments}
            renderItem={document => (
              <List.Item
                key={document.id}
                actions={[
                  <Tooltip title="Preview">
                    <Button 
                      type="text" 
                      icon={<EyeOutlined />} 
                      onClick={() => handlePreviewDocument(document)}
                    />
                  </Tooltip>,
                  <Tooltip title="Download">
                    <Button 
                      type="text" 
                      icon={<DownloadOutlined />} 
                      onClick={() => handleDownloadDocument(document)}
                    />
                  </Tooltip>,
                  <Tooltip title="Delete">
                    <Button 
                      type="text" 
                      danger 
                      icon={<DeleteOutlined />} 
                      onClick={() => handleDeleteDocument(document.id)}
                    />
                  </Tooltip>
                ]}
              >
                <List.Item.Meta
                  avatar={getDocumentIcon(document)}
                  title={
                    <Space>
                      <Typography.Text strong>
                        {document.document_name}
                      </Typography.Text>
                      <Tag color="blue">{getDocumentFileName(document)}</Tag>
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size="small">
                      <Typography.Text type="secondary">
                        Uploaded: {formatDate(document.timestamp)}
                      </Typography.Text>
                      {document.uploaded_by_details && (
                        <Typography.Text type="secondary">
                          By: {document.uploaded_by_details.email || 'Unknown'}
                        </Typography.Text>
                      )}
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <Empty description="No documents found" />
        )}
      </Card>
      
      {/* Document Preview Modal */}
      <Modal
        title={previewDocument ? `Preview: ${previewDocument.document_name}` : 'Document Preview'}
        visible={previewVisible}
        onCancel={handleClosePreview}
        footer={[
          <Button key="close" onClick={handleClosePreview}>
            Close
          </Button>,
          <Button 
            key="download" 
            type="primary" 
            icon={<DownloadOutlined />}
            onClick={() => handleDownloadDocument(previewDocument)}
          >
            Download
          </Button>
        ]}
        width={800}
      >
        {previewDocument && (
          <div style={{ textAlign: 'center' }}>
            {previewDocument.document_path ? (
              previewDocument.document_path.toLowerCase().endsWith('.pdf') ? (
                <iframe 
                  src={previewDocument.document_path} 
                  width="100%" 
                  height="500px" 
                  title="PDF Preview"
                  style={{ border: 'none' }}
                />
              ) : previewDocument.document_path.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/) ? (
                <img 
                  src={previewDocument.document_path} 
                  alt="Document Preview" 
                  style={{ maxWidth: '100%', maxHeight: '500px' }} 
                />
              ) : (
                <Typography.Text>
                  This document type cannot be previewed. Please download to view.
                </Typography.Text>
              )
            ) : (
              <Typography.Text>
                Preview not available
              </Typography.Text>
            )}
          </div>
        )}
      </Modal>
    </Box>
  );
};

export default LeadDocuments;
