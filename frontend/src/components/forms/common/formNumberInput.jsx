import React from 'react';
import { InputNumber, Form } from 'antd';

/**
 * Reusable form number input component using Ant Design
 * @param {string} label - Input label text
 * @param {number|string} value - Current input value
 * @param {function} onChange - Function to handle value changes
 * @param {string} name - Name of the input field
 * @param {string} placeholder - Placeholder text
 * @param {boolean} required - Whether the field is required
 * @param {boolean} disabled - Whether the field is disabled
 * @param {string} error - Error message to display
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @param {number} step - Step increment/decrement value
 * @param {string} prefix - Text or symbol to display before the input
 * @param {string} suffix - Text or symbol to display after the input
 * @param {string} helperText - Helper text to display below the input
 */
const FormNumberInput = ({
  label,
  value = '',
  onChange,
  name,
  placeholder = '',
  required = false,
  disabled = false,
  error = '',
  min,
  max,
  step = 1,
  prefix = '',
  suffix = '',
  helperText = '',
  fullWidth = true,
  ...props
}) => {
  // Handle input change
  const handleChange = (numValue) => {
    if (typeof onChange === 'function') {
      onChange(numValue, name);
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
      <InputNumber
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        prefix={prefix}
        suffix={suffix}
        style={{ width: fullWidth ? '100%' : 'auto' }}
        {...props}
      />
    </Form.Item>
  );
};

export default FormNumberInput;
