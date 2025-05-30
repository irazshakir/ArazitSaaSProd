import React from 'react';
import { Radio, Form, Typography, Space } from 'antd';

/**
 * Reusable form radio group component using Ant Design
 * @param {string} name - Form field name
 * @param {string} label - Input label
 * @param {string} value - Current value
 * @param {function} onChange - Change handler
 * @param {boolean} required - Whether the field is required
 * @param {string} error - Error message
 * @param {array} options - Array of options [{value: 'value1', label: 'Label 1'}]
 * @param {string} helperText - Helper text to display
 * @param {string} direction - Layout direction ('horizontal' or 'vertical')
 * @param {object} sx - Extra styling
 */
const FormRadioGroup = ({
  name,
  label,
  value,
  onChange,
  required = false,
  error = null,
  options = [],
  helperText = '',
  direction = 'horizontal',
  sx = {},
}) => {
  const handleChange = (e) => {
    onChange(e.target.value);
  };

  return (
    <Form.Item 
      label={label}
      required={required}
      validateStatus={error ? 'error' : ''}
      help={error || helperText}
      style={{ marginBottom: 16, ...sx }}
    >
      <Radio.Group 
        name={name}
        value={value}
        onChange={handleChange}
      >
        <Space direction={direction}>
          {options.map((option) => (
            <Radio 
              key={option.value} 
              value={option.value}
            >
              {option.label}
            </Radio>
          ))}
        </Space>
      </Radio.Group>
    </Form.Item>
  );
};

export default FormRadioGroup; 