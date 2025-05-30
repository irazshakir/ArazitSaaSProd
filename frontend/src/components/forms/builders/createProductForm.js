/**
 * Form builder utility for creating product forms
 * Provides standard configuration options for different product types
 */

// Removing date-fns import temporarily
// import { format } from 'date-fns';

// Simple date formatter function to use until date-fns is installed
const formatDate = (date) => {
  if (!date) return '';
  if (typeof date === 'string') return date;
  
  try {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (err) {
    console.error('Error formatting date:', err);
    return '';
  }
};

/**
 * Create initial values for a new form
 * @param {string} productType - Type of product (hajjPackage, umrahPackage, etc)
 * @param {object} overrideValues - Any values that should override defaults
 * @returns {object} Initial form values
 */
export const createInitialValues = (productType, overrideValues = {}) => {
  // Common defaults that apply to most products
  const commonDefaults = {
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  // Product-specific defaults
  const productDefaults = {
    hajjPackage: {
      package_name: '',
      visa: 'included',
      ziyarat: 'makkah_medinah',
      flight_carrier: '',
      package_star: '5',
      hajj_days: 14,
      departure_date: null,
      return_date: null,
      maktab_no: '',
      hotel_makkah: '',
      makkah_star: '5',
      makkah_check_in: null,
      makkah_check_out: null,
      makkah_room_type: 'Quad',
      makkah_nights: 6,
      hotel_madinah: '',
      madinah_star: '3',
      madinah_check_in: null,
      madinah_check_out: null,
      madinah_room_type: 'Quad',
      madinah_nights: 6,
      total_cost: 0,
      selling_price: 0,
      tags: [],
    },
    umrahPackage: {
      package_name: '',
      umrah_days: 14,
      umrah_start_date: null,
      umrah_end_date: null,
      hotel_makkah: '',
      hotel_medina: '',
      room_type: '',
      visa: '',
      flight_carrier: '',
      buying_price: 0,
      selling_price: 0,
    },
    // Add other product type defaults as needed
  };

  const baseValues = {
    ...commonDefaults,
    ...(productDefaults[productType] || {}),
  };

  return { ...baseValues, ...overrideValues };
};

/**
 * Create validation rules for a form
 * @param {string} productType - Type of product (hajjPackage, umrahPackage, etc)
 * @returns {object} Validation rules
 */
export const createValidationRules = (productType) => {
  // Common validation rules used across multiple product types
  const commonRules = {
    is_active: {},
  };

  // Product-specific validation rules
  const productRules = {
    hajjPackage: {
      package_name: {
        required: 'Package name is required',
        minLength: 3,
        maxLength: 255,
      },
      hajj_days: {
        required: 'Number of days is required',
        min: 1,
      },
      package_star: {
        required: 'Star rating is required',
      },
      departure_date: {
        required: 'Departure date is required',
      },
      return_date: {
        required: 'Return date is required',
        validate: (value, values) => {
          if (values.departure_date && value < values.departure_date) {
            return 'Return date must be after departure date';
          }
          return null;
        }
      },
      hotel_makkah: {
        required: 'Makkah hotel is required',
      },
      hotel_madinah: {
        required: 'Madinah hotel is required',
      },
      makkah_room_type: {
        required: 'Makkah room type is required',
      },
      madinah_room_type: {
        required: 'Madinah room type is required',
      },
      total_cost: {
        required: 'Total cost is required',
        min: 0,
      },
      selling_price: {
        required: 'Selling price is required',
        min: 0,
      },
    },
    umrahPackage: {
      package_name: {
        required: 'Package name is required',
        minLength: 3,
        maxLength: 255,
      },
      umrah_days: {
        required: 'Number of days is required',
        min: 1,
      },
      // Add other validation rules for umrah packages
    },
    // Add other product types as needed
  };

  // Return merged rules for the specified product type
  return {
    ...commonRules,
    ...(productRules[productType] || {}),
  };
};

/**
 * Format form data for API submission
 * @param {string} productType - Type of product (hajjPackage, umrahPackage, etc)
 * @param {object} formData - Form data to format
 * @returns {object} Formatted data ready for API
 */
export const formatFormDataForApi = (productType, formData) => {
  const data = { ...formData };
  
  // Handle common field formatting
  if (data.created_at instanceof Date) {
    data.created_at = formatDate(data.created_at);
  }
  if (data.updated_at instanceof Date) {
    data.updated_at = formatDate(data.updated_at);
  }
  
  // Format dates for specific product types
  if (productType === 'hajjPackage') {
    if (data.departure_date instanceof Date) {
      data.departure_date = formatDate(data.departure_date);
    }
    if (data.return_date instanceof Date) {
      data.return_date = formatDate(data.return_date);
    }
    if (data.makkah_check_in instanceof Date) {
      data.makkah_check_in = formatDate(data.makkah_check_in);
    }
    if (data.makkah_check_out instanceof Date) {
      data.makkah_check_out = formatDate(data.makkah_check_out);
    }
    if (data.madinah_check_in instanceof Date) {
      data.madinah_check_in = formatDate(data.madinah_check_in);
    }
    if (data.madinah_check_out instanceof Date) {
      data.madinah_check_out = formatDate(data.madinah_check_out);
    }
  } else if (productType === 'umrahPackage') {
    if (data.umrah_start_date instanceof Date) {
      data.umrah_start_date = formatDate(data.umrah_start_date);
    }
    if (data.umrah_end_date instanceof Date) {
      data.umrah_end_date = formatDate(data.umrah_end_date);
    }
  }
  
  return data;
};

/**
 * Get field options for select fields based on product type
 * @param {string} productType - Type of product
 * @returns {object} Field options
 */
export const getFieldOptions = (productType) => {
  const commonOptions = {
    status: [
      { value: true, label: 'Active' },
      { value: false, label: 'Inactive' },
    ],
  };
  
  const productOptions = {
    hajjPackage: {
      room_type: [
        { value: 'Double', label: 'Double' },
        { value: 'Triple', label: 'Triple' },
        { value: 'Quad', label: 'Quad' },
        { value: 'Penta', label: 'Penta' },
        { value: 'Hexa', label: 'Hexa' },
        { value: 'Sharing', label: 'Sharing' },
      ],
      hajj_star: [
        { value: 1, label: '1 Star' },
        { value: 2, label: '2 Stars' },
        { value: 3, label: '3 Stars' },
        { value: 4, label: '4 Stars' },
        { value: 5, label: '5 Stars' },
      ],
    },
    umrahPackage: {
      room_type: [
        { value: 'Double', label: 'Double' },
        { value: 'Triple', label: 'Triple' },
        { value: 'Quad', label: 'Quad' },
        { value: 'Sharing', label: 'Sharing' },
      ],
      umrah_star: [
        { value: 1, label: '1 Star' },
        { value: 2, label: '2 Stars' },
        { value: 3, label: '3 Stars' },
        { value: 4, label: '4 Stars' },
        { value: 5, label: '5 Stars' },
      ],
    },
    // Add other product types as needed
  };
  
  return {
    ...commonOptions,
    ...(productOptions[productType] || {}),
  };
};

/**
 * Get field configuration for a form
 * @param {string} productType - Type of product
 * @returns {array} Array of field configuration objects
 */
export const getFormSections = (productType) => {
  if (productType === 'hajjPackage') {
    return [
      {
        title: 'Basic Information',
        fields: [
          { name: 'package_name', label: 'Package Name', type: 'text', required: true, gridSize: { xs: 12, md: 6 } },
          { name: 'is_active', label: 'Status', type: 'select', options: 'status', gridSize: { xs: 12, md: 6 } },
        ],
      },
      {
        title: 'Travel Information',
        fields: [
          { name: 'departure_date', label: 'Travel Date', type: 'date', required: true, gridSize: { xs: 12, md: 6 } },
          { name: 'return_date', label: 'Return Date', type: 'date', required: true, gridSize: { xs: 12, md: 6 } },
          { name: 'hajj_days', label: 'Number of Days', type: 'number', required: true, min: 1, gridSize: { xs: 12, md: 4 } },
          { name: 'package_star', label: 'Star Rating', type: 'select', options: 'hajj_star', required: true, gridSize: { xs: 12, md: 4 } },
          { name: 'makkah_room_type', label: 'Room Type', type: 'select', options: 'room_type', required: true, gridSize: { xs: 12, md: 4 } },
        ],
      },
      {
        title: 'Accommodation Details',
        fields: [
          { name: 'hotel_makkah', label: 'Hotel in Makkah', type: 'text', required: true, gridSize: { xs: 12, md: 6 } },
          { name: 'hotel_madinah', label: 'Hotel in Medina', type: 'text', required: true, gridSize: { xs: 12, md: 6 } },
          { name: 'maktab_no', label: 'Maktab Number', type: 'text', gridSize: { xs: 12, md: 6 } },
        ],
      },
      {
        title: 'Transportation Details',
        fields: [
          { name: 'flight_carrier', label: 'Airline', type: 'text', gridSize: { xs: 12, md: 6 } },
          { name: 'visa', label: 'Visa Type', type: 'text', gridSize: { xs: 12, md: 6 } },
        ],
      },
      {
        title: 'Pricing Information',
        fields: [
          { name: 'total_cost', label: 'Total Cost', type: 'number', prefix: '$', min: 0, gridSize: { xs: 12, md: 6 } },
          { name: 'selling_price', label: 'Selling Price', type: 'number', prefix: '$', min: 0, required: true, gridSize: { xs: 12, md: 6 } },
        ],
      },
    ];
  }
  
  if (productType === 'umrahPackage') {
    // Define form sections for Umrah packages
    return [
      // Similar structure to Hajj packages, with Umrah-specific fields
    ];
  }
  
  // Return empty array for unknown product type
  return [];
};

export default {
  createInitialValues,
  createValidationRules,
  formatFormDataForApi,
  getFieldOptions,
  getFormSections,
}; 