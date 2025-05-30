import React from 'react';
import { Input, Form } from 'antd';

/**
 * Reusable form text input component using Ant Design
 * @param {string} label - Input label text
 * @param {string} value - Current input value
 * @param {function} onChange - Function to handle value changes
 * @param {string} name - Name of the input field
 * @param {string} placeholder - Placeholder text
 * @param {boolean} required - Whether the field is required
 * @param {boolean} disabled - Whether the field is disabled
 * @param {string} error - Error message to display
 * @param {object} inputProps - Additional props for the input element
 * @param {string} helperText - Helper text to display below the input
 */
const FormTextInput = ({
  label,
  value = '',
  onChange,
  name,
  placeholder = '',
  required = false,
  disabled = false,
  error = '',
  inputProps = {},
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
      <Input
        name={name}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        style={{ width: fullWidth ? '100%' : 'auto' }}
        {...inputProps}
        {...props}
      />
    </Form.Item>
  );
};

export default FormTextInput;
