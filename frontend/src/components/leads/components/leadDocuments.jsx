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
  Select,
  Tag,
  Modal,
  Tooltip,
  Spin
} from 'antd';
import { 
  UploadOutlined, 
  FileOutlined, 
  FilePdfOutlined, 
  FileImageOutlined, 
  FileTextOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { Box } from '@mui/material';
import api from '../../../services/api';

const { Dragger } = Upload;

/**
 * Component for displaying and managing lead documents
 * @param {string} leadId - The ID of the lead
 * @param {array} documents - Initial documents data
 */
const LeadDocuments = ({ leadId, documents = [] }) => {
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
    if (!documents || documents.length === 0) {
      fetchDocuments();
    } else {
      setLeadDocuments(documents);
    }
  }, [documents, leadId]);
  
  // Fetch documents from API
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/lead-documents/?lead=${leadId}`);
      
      // Process response data
      let documentsArray = Array.isArray(response.data) 
        ? response.data
        : (response.data?.results && Array.isArray(response.data.results))
          ? response.data.results
          : [];
      
      setLeadDocuments(documentsArray);
    } catch (error) {
      console.error('Error fetching documents:', error);
      message.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle file upload
  const handleUpload = async (values) => {
    try {
      setSubmitting(true);
      
      // Create form data for file upload
      const formData = new FormData();
      formData.append('document_type', values.document_type);
      formData.append('lead', leadId);
      formData.append('document_path', values.document_path[0].originFileObj);
      
      const response = await api.post('/leads/' + leadId + '/add-document/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Add new document to the list
      setLeadDocuments([response.data, ...leadDocuments]);
      
      // Reset form
      form.resetFields();
      
      message.success('Document uploaded successfully');
    } catch (error) {
      console.error('Error uploading document:', error);
      message.error('Failed to upload document');
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
  
  // Custom file upload props
  const uploadProps = {
    beforeUpload: (file) => {
      // Prevent automatic upload
      return false;
    },
    maxCount: 1,
    multiple: false
  };
  
  return (
    <Box sx={{ py: 2 }}>
      {/* Upload Document Form */}
      <Card title="Upload Document" style={{ marginBottom: 16 }}>
        <Form form={form} onFinish={handleUpload} layout="vertical">
          <Form.Item
            name="document_type"
            label="Document Type"
            rules={[{ required: true, message: 'Please select document type' }]}
          >
            <Select placeholder="Select document type">
              {documentTypes.map(type => (
                <Select.Option key={type.value} value={type.value}>
                  {type.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="document_path"
            label="Document"
            rules={[{ required: true, message: 'Please upload a document' }]}
            valuePropName="fileList"
            getValueFromEvent={e => Array.isArray(e) ? e : e?.fileList}
          >
            <Dragger {...uploadProps}>
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p className="ant-upload-text">Click or drag file to this area to upload</p>
              <p className="ant-upload-hint">
                Support for a single file upload. Please upload documents in PDF, JPG, PNG, or DOC format.
              </p>
            </Dragger>
          </Form.Item>
          
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              icon={<UploadOutlined />} 
              loading={submitting}
            >
              Upload Document
            </Button>
          </Form.Item>
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
                        {getDocumentTypeLabel(document.document_type)}
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
        title={previewDocument ? `Preview: ${getDocumentTypeLabel(previewDocument.document_type)}` : 'Document Preview'}
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
