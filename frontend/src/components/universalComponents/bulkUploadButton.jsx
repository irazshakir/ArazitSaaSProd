import React, { useState } from 'react';
import { Button, IconButton, Input } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';

const BulkUploadButton = ({ onUpload, buttonText = 'Bulk Upload', accept = '.csv,.xlsx,.xls' }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      onUpload(file);
    }
  };

  return (
    <>
      <Input
        type="file"
        id="bulk-upload-input"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
        accept={accept}
      />
      <label htmlFor="bulk-upload-input">
        <Button
          variant="outlined"
          component="span"
          startIcon={<UploadFileIcon />}
          sx={{
            borderColor: 'primary.main',
            color: 'primary.main',
            '&:hover': {
              borderColor: 'primary.dark',
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
            },
          }}
        >
          {buttonText}
        </Button>
      </label>
    </>
  );
};

export default BulkUploadButton; 