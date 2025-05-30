import React from 'react';
import { DatePicker, Form, Typography } from 'antd';
import dayjs from 'dayjs';

/**
 * Reusable form date picker component using Ant Design
 * @param {string} label - Input label text
 * @param {Date|null} value - Current selected date
 * @param {function} onChange - Function to handle date changes
 * @param {string} name - Name of the field
 * @param {boolean} required - Whether the field is required
 * @param {boolean} disabled - Whether the field is disabled
 * @param {string} error - Error message to display
 * @param {Date} minDate - Minimum selectable date
 * @param {Date} maxDate - Maximum selectable date
 * @param {string} helperText - Helper text to display below the input
 * @param {string} format - Date format to display (default: 'YYYY-MM-DD')
 */
const FormDatePicker = ({
  label,
  value = null,
  onChange,
  name,
  required = false,
  disabled = false,
  error = '',
  minDate,
  maxDate,
  helperText = '',
  format = 'YYYY-MM-DD', // Ant Design date format
  fullWidth = true,
  ...props
}) => {
  // Convert date value to dayjs object for Ant Design DatePicker
  const dayjsValue = value ? dayjs(value) : null;

  // Handle date change
  const handleChange = (date, dateString) => {
    if (typeof onChange === 'function') {
      // Convert dayjs to JavaScript Date or null
      const jsDate = date ? date.toDate() : null;
      onChange(jsDate, name);
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
      <DatePicker
        value={dayjsValue}
        onChange={handleChange}
        format={format}
        disabled={disabled}
        disabledDate={(currentDate) => {
          let disallowed = false;
          if (minDate && currentDate < dayjs(minDate)) disallowed = true;
          if (maxDate && currentDate > dayjs(maxDate)) disallowed = true;
          return disallowed;
        }}
        style={{ width: fullWidth ? '100%' : 'auto' }}
        {...props}
      />
    </Form.Item>
  );
};

export default FormDatePicker;
