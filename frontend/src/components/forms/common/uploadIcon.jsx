import React, { useState } from 'react';
import { Upload, Button, message, Card, Typography, Space } from 'antd';
import { UploadOutlined, FileImageOutlined, FilePdfOutlined, FileOutlined } from '@ant-design/icons';

/**
 * Universal upload component for documents, images, PDFs
 * @param {string} title - Title for the upload section
 * @param {function} onChange - Function to call when files change
 * @param {string} accept - File types to accept (e.g., 'image/*,application/pdf')
 * @param {boolean} multiple - Whether to allow multiple file uploads
 * @param {array} fileList - List of already uploaded files
 * @param {number} maxCount - Maximum number of files allowed
 * @param {string} buttonText - Text to display on upload button
 * @param {object} style - Additional styling for the component
 */
const UploadIcon = ({
  title = 'Upload',
  onChange,
  accept = 'image/*',
  multiple = false,
  fileList = [],
  maxCount = 1,
  buttonText = 'Upload',
  style = {},
}) => {
  const [files, setFiles] = useState(fileList);

  // Get appropriate icon based on file type
  const getFileIcon = (file) => {
    const fileType = file.type || '';
    
    if (fileType.includes('image')) {
      return <FileImageOutlined />;
    } else if (fileType.includes('pdf')) {
      return <FilePdfOutlined />;
    } else {
      return <FileOutlined />;
    }
  };

  // Handle file upload
  const handleChange = (info) => {
    const { fileList } = info;
    
    // Update local state with new file list
    setFiles(fileList);
    
    // Call onChange with the filtered file list
    if (onChange) {
      onChange(fileList);
    }
  };

  // Custom upload behavior - prevents automatic uploads
  const customRequest = ({ file, onSuccess }) => {
    // Simulate a success callback after 0.5 second
    setTimeout(() => {
      onSuccess("ok");
    }, 500);
  };

  // Upload button
  const uploadButton = (
    <Button icon={<UploadOutlined />} type="primary" style={{ backgroundColor: '#9d277c', borderColor: '#9d277c' }}>
      {buttonText}
    </Button>
  );

  return (
    <Card title={title} style={{ marginBottom: 24, ...style }}>
      <Upload
        accept={accept}
        fileList={files}
        onChange={handleChange}
        multiple={multiple}
        maxCount={maxCount}
        listType="picture"
        className="upload-list-inline"
        customRequest={customRequest}
        beforeUpload={(file) => {
          // Don't upload immediately, just return false
          return false;
        }}
      >
        {files.length >= maxCount ? null : uploadButton}
      </Upload>
      
      {files.length === 0 && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          marginTop: 16,
          height: 100,
          border: '1px dashed #d9d9d9',
          borderRadius: 8,
          backgroundColor: '#fafafa'
        }}>
          <Space direction="vertical" align="center">
            <div style={{ fontSize: 32, color: '#d9d9d9' }}>
              <FileImageOutlined />
            </div>
            <Typography.Text type="secondary">
              Drag file here or click upload button
            </Typography.Text>
          </Space>
        </div>
      )}
    </Card>
  );
};

export default UploadIcon;
