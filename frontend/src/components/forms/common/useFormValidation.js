import { useState, useCallback } from 'react';

/**
 * Custom hook for form validation
 * @param {object} initialValues - Initial form values
 * @param {object} validationRules - Validation rules for each field
 * @returns {object} Form state, errors, handlers and validation methods
 */
const useFormValidation = (
  initialValues = {}, 
  validationRules = {}
) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  /**
   * Handle input change
   * @param {string|object} nameOrValue - Field name or value object
   * @param {*} value - New field value
   */
  const handleChange = useCallback((nameOrValue, value) => {
    // If the first argument is an object, update values directly
    if (typeof nameOrValue === 'object' && nameOrValue !== null) {
      setValues(prev => ({ ...prev, ...nameOrValue }));
      return;
    }

    // Otherwise treat first arg as name and second as value
    const name = nameOrValue;
    setValues(prev => ({ ...prev, [name]: value }));
    
    // Mark field as touched
    if (!touched[name]) {
      setTouched(prev => ({ ...prev, [name]: true }));
    }
    
    // Clear error when changing value
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }, [errors, touched]);

  /**
   * Handle input blur
   * @param {string} name - Field name
   */
  const handleBlur = useCallback((name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    
    // Validate field on blur
    if (validationRules[name]) {
      const validationResult = validateField(name, values[name]);
      if (validationResult) {
        setErrors(prev => ({ ...prev, [name]: validationResult }));
      } else {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    }
  }, [values, validationRules]);

  /**
   * Reset form to initial values
   * @param {object} newValues - New initial values (optional)
   */
  const resetForm = useCallback((newValues = initialValues) => {
    setValues(newValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  /**
   * Validate a single field
   * @param {string} name - Field name
   * @param {*} value - Field value
   * @returns {string|null} Error message or null if valid
   */
  const validateField = useCallback((name, value) => {
    const rules = validationRules[name];
    if (!rules) return null;

    // Required check
    if (rules.required && (value === undefined || value === null || value === '')) {
      return rules.required === true ? `${name} is required` : rules.required;
    }

    // Skip other validations if empty and not required
    if (value === undefined || value === null || value === '') {
      return null;
    }

    // Min length check
    if (rules.minLength !== undefined && typeof value === 'string' && value.length < rules.minLength) {
      return rules.minLengthMessage || `Minimum length is ${rules.minLength}`;
    }

    // Max length check
    if (rules.maxLength !== undefined && typeof value === 'string' && value.length > rules.maxLength) {
      return rules.maxLengthMessage || `Maximum length is ${rules.maxLength}`;
    }

    // Min value check
    if (rules.min !== undefined && typeof value === 'number' && value < rules.min) {
      return rules.minMessage || `Minimum value is ${rules.min}`;
    }

    // Max value check
    if (rules.max !== undefined && typeof value === 'number' && value > rules.max) {
      return rules.maxMessage || `Maximum value is ${rules.max}`;
    }

    // Pattern check
    if (rules.pattern && !rules.pattern.test(value)) {
      return rules.patternMessage || `Invalid format`;
    }

    // Custom validation
    if (typeof rules.validate === 'function') {
      return rules.validate(value, values);
    }

    return null;
  }, [validationRules, values]);

  /**
   * Validate all fields
   * @returns {boolean} True if form is valid
   */
  const validateForm = useCallback(() => {
    const newErrors = {};
    let isValid = true;

    for (const name in validationRules) {
      const error = validateField(name, values[name]);
      if (error) {
        newErrors[name] = error;
        isValid = false;
      }
    }

    setErrors(newErrors);
    
    // Mark all fields as touched
    const newTouched = {};
    for (const name in validationRules) {
      newTouched[name] = true;
    }
    setTouched(prev => ({ ...prev, ...newTouched }));

    return isValid;
  }, [values, validationRules, validateField]);

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    resetForm,
    validateForm,
    validateField,
    setValues,
    setErrors,
    setTouched,
    isValid: Object.keys(errors).length === 0
  };
};

export default useFormValidation; 