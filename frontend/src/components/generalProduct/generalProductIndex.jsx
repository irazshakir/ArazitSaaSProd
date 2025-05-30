import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Stack, Grid, Paper, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { message } from 'antd';

// Import universal components
import SearchBar from '../universalComponents/searchBar';
import DownloadButton from '../universalComponents/downloadButton';
import FilterButton from '../universalComponents/filterButton';
import CreateButton from '../universalComponents/createButton';
import TableList from '../universalComponents/tableList';

const GeneralProductIndex = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState({});

  // Define table columns
  const columns = [
    { 
      field: 'productName', 
      headerName: 'PRODUCT NAME', 
      width: '40%',
      minWidth: 200,
      sortable: true 
    },
    { 
      field: 'tenant_name', 
      headerName: 'TENANT', 
      width: '30%',
      minWidth: 150,
      sortable: true
    },
    { 
      field: 'created_at', 
      headerName: 'CREATED AT', 
      width: '30%',
      minWidth: 150,
      sortable: true,
      render: (value) => value ? new Date(value).toLocaleDateString() : 'N/A'
    }
  ];

  // Fetch data from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await api.get('general-product/products/');
        
        // Check if response.data is directly an array or has a results property
        let productsArray = Array.isArray(response.data) 
          ? response.data
          : (response.data?.results && Array.isArray(response.data.results))
            ? response.data.results
            : [];
            
        // Transform data for UI representation
        const formattedData = productsArray.map(product => ({
          ...product,
          id: product.id,
          productName: product.productName || 'Unnamed Product',
          tenant_name: product.tenant_name || 'Unknown Tenant'
        }));
        
        setProducts(formattedData);
        setFilteredProducts(formattedData);
      } catch (error) {
        message.error('Failed to load products. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Handle search
  const handleSearch = (query) => {
    setSearchQuery(query);
    applyFiltersAndSearch(query, activeFilters);
  };

  // Apply both filters and search
  const applyFiltersAndSearch = (query, filters) => {
    let results = [...products];
    
    // Apply search
    if (query) {
      const lowercasedQuery = query.toLowerCase();
      results = results.filter(product => 
        product.productName?.toLowerCase().includes(lowercasedQuery)
      );
    }
    
    setFilteredProducts(results);
  };

  // Handle export
  const handleExport = (data, format, filename) => {
    if (format === 'csv') {
      try {
        const headers = columns.map(col => col.headerName);
        const rows = data.map(item => {
          return columns.map(col => {
            const value = item[col.field];
            if (col.field === 'created_at') {
              return value ? new Date(value).toLocaleDateString() : '';
            }
            return value || '';
          });
        });
        
        const csvContent = [
          headers.join(','),
          ...rows.map(row => row.join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        message.success(`Exported ${data.length} products as CSV`);
      } catch (error) {
        message.error('Failed to export data');
      }
    }
  };

  // Handle create new product
  const handleCreateProduct = () => {
    navigate('/dashboard/general-products/create');
  };

  // Handle view product
  const handleViewProduct = (product) => {
    navigate(`/dashboard/general-products/${product.id}`);
  };

  // Handle edit product
  const handleEditProduct = (product) => {
    navigate(`/dashboard/general-products/${product.id}/edit`);
  };

  // Handle delete product
  const handleDeleteProduct = async (product) => {
    try {
      message.loading('Deleting product...', 0);
      await api.delete(`general-product/products/${product.id}/`);
      message.destroy();
      message.success(`Product "${product.productName}" deleted successfully`);
      
      const updatedProducts = products.filter(item => item.id !== product.id);
      setProducts(updatedProducts);
      setFilteredProducts(filteredProducts.filter(item => item.id !== product.id));
    } catch (error) {
      message.destroy();
      message.error('Failed to delete product. Please try again.');
    }
  };

  return (
    <Container maxWidth="xl" sx={{ pt: 2, pb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              backgroundColor: 'white'
            }}
          >
            {/* Header Section with Title and Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" component="h1" sx={{ fontWeight: 600 }}>
                General Products
              </Typography>
              
              <Stack direction="row" spacing={2}>
                <DownloadButton 
                  data={filteredProducts}
                  filename="general-products"
                  onExport={handleExport}
                />
                <CreateButton 
                  onClick={handleCreateProduct}
                  buttonText="Add new"
                />
              </Stack>
            </Box>
            
            {/* Search Row */}
            <Box sx={{ display: 'flex', mb: 3, gap: 2 }}>
              <Box sx={{ flexGrow: 1 }}>
                <SearchBar 
                  placeholder="Search product name..." 
                  onSearch={handleSearch}
                />
              </Box>
            </Box>
            
            {/* Data Table */}
            <TableList
              columns={columns}
              data={filteredProducts}
              loading={loading}
              onViewClick={handleViewProduct}
              onEditClick={handleEditProduct}
              onDeleteClick={handleDeleteProduct}
              pagination={true}
              rowsPerPage={10}
              rowsPerPageOptions={[5, 10, 25, 50, 100]}
              defaultSortField="productName"
              defaultSortDirection="asc"
            />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default GeneralProductIndex;
