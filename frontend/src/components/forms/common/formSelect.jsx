import React from 'react';
import { Select, Form } from 'antd';

/**
 * Reusable form select component using Ant Design
 * @param {string} label - Select label text
 * @param {any} value - Current selected value
 * @param {function} onChange - Function to handle value changes
 * @param {string} name - Name of the select field
 * @param {array} options - Array of options [{value, label}]
 * @param {boolean} required - Whether the field is required
 * @param {boolean} disabled - Whether the field is disabled
 * @param {string} error - Error message to display
 * @param {string} placeholder - Text to display when no option is selected
 * @param {string} helperText - Helper text to display below the select
 */
const FormSelect = ({
  label,
  value = undefined,
  onChange,
  name,
  options = [],
  required = false,
  disabled = false,
  error = '',
  placeholder = 'Select an option',
  helperText = '',
  fullWidth = true,
  ...props
}) => {
  // Handle select change
  const handleChange = (value) => {
    if (typeof onChange === 'function') {
      onChange(value, name);
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
      <Select
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        style={{ width: fullWidth ? '100%' : 'auto' }}
        options={options}
        {...props}
      >
        {/* Options are provided directly through the options prop in Ant Design */}
      </Select>
    </Form.Item>
  );
};

export default FormSelect;
