import React from 'react';
import { Input, Form } from 'antd';

const { TextArea } = Input;

/**
 * Reusable form textarea component for multi-line text input using Ant Design
 * @param {string} label - Input label text
 * @param {string} value - Current input value
 * @param {function} onChange - Function to handle value changes
 * @param {string} name - Name of the input field
 * @param {string} placeholder - Placeholder text
 * @param {boolean} required - Whether the field is required
 * @param {boolean} disabled - Whether the field is disabled
 * @param {string} error - Error message to display
 * @param {number} rows - Number of rows to display
 * @param {string} helperText - Helper text to display below the input
 */
const FormTextarea = ({
  label,
  value = '',
  onChange,
  name,
  placeholder = '',
  required = false,
  disabled = false,
  error = '',
  rows = 4,
  maxRows = 8, // This prop is not used in Ant Design TextArea
  helperText = '',
  fullWidth = true,
  ...props
}) => {
  // Handle input change
  const handleChange = (e) => {
    const newValue = e.target.value;
    if (typeof onChange === 'function') {
      onChange(newValue, name);
    }
  };

  return (
    <Form.Item
      label={
        label && (
          <span>
            {label}
            {required && <span style={{ color: '#ff4d4f', marginLeft: 4 }}>*</span>}
          </span>
        )
      }
      validateStatus={error ? 'error' : ''}
      help={error || helperText}
      style={{ marginBottom: '16px' }}
    >
      <TextArea
        name={name}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        style={{ width: fullWidth ? '100%' : 'auto' }}
        {...props}
      />
    </Form.Item>
  );
};

export default FormTextarea;
