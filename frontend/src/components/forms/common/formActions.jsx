import React from 'react';
import { Space, Button, Spin } from 'antd';
import { SaveOutlined, CloseCircleOutlined } from '@ant-design/icons';

/**
 * Reusable form actions component for submit/cancel buttons using Ant Design
 * @param {function} onSubmit - Function to call on submit
 * @param {function} onCancel - Function to call on cancel
 * @param {boolean} isLoading - Whether the form is in a loading state
 * @param {string} submitLabel - Label for the submit button
 * @param {string} cancelLabel - Label for the cancel button
 * @param {boolean} showSubmit - Whether to show the submit button
 * @param {boolean} showCancel - Whether to show the cancel button
 * @param {string} position - Position of the buttons ('left', 'center', 'right', 'between')
 * @param {object} sx - Additional styling
 */
const FormActions = ({
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  showSubmit = true,
  showCancel = true,
  position = 'right',
  sx = {},
}) => {
  const getJustify = () => {
    switch (position) {
      case 'left':
        return 'flex-start';
      case 'center':
        return 'center';
      case 'right':
        return 'flex-end';
      case 'between':
        return 'space-between';
      default:
        return 'flex-end';
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: getJustify(),
        paddingTop: 24,
        marginTop: 16,
        borderTop: '1px solid rgba(0, 0, 0, 0.1)',
        ...sx,
      }}
    >
      <Space>
        {/* Cancel Button */}
        {showCancel && (
          <Button
            type="default"
            onClick={onCancel}
            disabled={isLoading}
            icon={<CloseCircleOutlined />}
          >
            {cancelLabel}
          </Button>
        )}

        {/* Submit Button */}
        {showSubmit && (
          <Button
            type="primary"
            onClick={onSubmit}
            disabled={isLoading}
            icon={isLoading ? <Spin size="small" /> : <SaveOutlined />}
            style={{ backgroundColor: '#9d277c', borderColor: '#9d277c' }}
          >
            {isLoading ? 'Saving...' : submitLabel}
          </Button>
        )}
      </Space>
    </div>
  );
};

export default FormActions;
