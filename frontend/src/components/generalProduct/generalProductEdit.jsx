import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Alert } from '@mui/material';
import { message } from 'antd';
import api from '../../services/api';
import GeneralProductForm from './generalProductForm';

const GeneralProductEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await api.get(`general-product/products/${id}/`);
        setProduct(response.data);
        setLoading(false);
      } catch (error) {
        setError('Failed to load product data. Please try again.');
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // Handle successful form submission
  const handleSuccess = () => {
    message.success('Product updated successfully!');
    navigate('/dashboard/general-products');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!product) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="warning">Product not found</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <GeneralProductForm 
        initialData={product}
        isEditMode={true}
        onSuccess={handleSuccess}
      />
    </Box>
  );
};

export default GeneralProductEdit;
