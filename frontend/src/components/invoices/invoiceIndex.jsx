import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Stack, Grid, Paper, Chip, Button, IconButton, Tooltip } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import { message } from 'antd';
import dataAccessService from '../../services/dataAccessService';
import { Print as PrintIcon, Visibility as VisibilityIcon } from '@mui/icons-material';

// Import universal components
import SearchBar from '../universalComponents/searchBar';
import DownloadButton from '../universalComponents/downloadButton';
import FilterButton from '../universalComponents/filterButton';
import CreateButton from '../universalComponents/createButton';
import TableList from '../universalComponents/tableList';
import TableSkeleton from '../universalComponents/tableSkeleton';

// Import auth utilities
import { getUser, getUserRole } from '../../utils/auth';

const InvoiceIndex = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState({});
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [tenantId, setTenantId] = useState(null);
  
  // Get current user and role from localStorage
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      navigate('/login');
      return;
    }
    
    try {
      // Get user data from localStorage
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const userRole = getUserRole();
      const tenantId = localStorage.getItem('tenant_id');
      
      setUser(userData);
      setUserRole(userRole);
      setTenantId(tenantId);
      
      console.log('User data loaded:', { 
        userData, 
        userRole, 
        tenantId
      });
    } catch (error) {
      console.error('Error parsing user data:', error);
      message.error('Error loading user data. Please log in again.');
      navigate('/login');
    }
  }, [navigate]);

  // Add this effect to refresh when navigating to the page
  useEffect(() => {
    if (user && userRole && tenantId) {
      refreshInvoices();
    }
  }, [location.pathname]);

  // Define table columns
  const columns = [
    { 
      field: 'invoice_number', 
      headerName: 'INVOICE #', 
      width: '15%',
      minWidth: 120,
      sortable: true 
    },
    { 
      field: 'customer_name', 
      headerName: 'CUSTOMER', 
      width: '20%',
      minWidth: 150,
      sortable: true
    },
    { 
      field: 'lead_name', 
      headerName: 'LEAD', 
      width: '15%',
      minWidth: 120,
      sortable: true,
      render: (value) => value || 'No Lead'
    },
    { 
      field: 'issue_date', 
      headerName: 'ISSUE DATE', 
      width: '12%',
      minWidth: 120,
      sortable: true,
      render: (value) => value ? new Date(value).toLocaleDateString() : 'N/A'
    },
    { 
      field: 'due_date', 
      headerName: 'DUE DATE', 
      width: '12%',
      minWidth: 120,
      sortable: true,
      render: (value) => value ? new Date(value).toLocaleDateString() : 'N/A'
    },
    { 
      field: 'total_amount', 
      headerName: 'TOTAL', 
      width: '10%',
      minWidth: 100,
      sortable: true,
      render: (value) => parseFloat(value).toFixed(2)
    },
    { 
      field: 'status_display', 
      headerName: 'STATUS', 
      width: '12%',
      minWidth: 100,
      sortable: true,
      type: 'status',
      render: (value, row) => (
        <Chip 
          label={value}
          size="small"
          sx={{ 
            borderRadius: '4px',
            backgroundColor: getStatusColor(row.status).bg,
            color: getStatusColor(row.status).text,
            fontWeight: 500
          }} 
        />
      )
    },
    { 
      field: 'created_at', 
      headerName: 'CREATED', 
      width: '12%',
      minWidth: 120,
      sortable: true,
      render: (value) => value ? new Date(value).toLocaleDateString() : 'N/A'
    }
  ];

  // Get color based on status
  const getStatusColor = (status) => {
    switch(status) {
      case 'PAID':
        return { bg: 'rgba(46, 204, 113, 0.2)', text: 'rgb(46, 204, 113)' };
      case 'PARTIALLY_PAID':
        return { bg: 'rgba(255, 152, 0, 0.2)', text: 'rgb(255, 152, 0)' };
      case 'NO_PAYMENT':
        return { bg: 'rgba(231, 76, 60, 0.2)', text: 'rgb(231, 76, 60)' };
      default:
        return { bg: 'rgba(189, 189, 189, 0.2)', text: 'rgb(189, 189, 189)' };
    }
  };

  // Filter options
  const filterOptions = [
    {
      name: 'status',
      label: 'Status',
      options: [
        { value: 'PAID', label: 'Paid' },
        { value: 'PARTIALLY_PAID', label: 'Partially Paid' },
        { value: 'NO_PAYMENT', label: 'No Payment Yet' }
      ]
    }
  ];

  // Fetch data from API
  useEffect(() => {
    if (user && userRole && tenantId) {
      const fetchInvoices = async () => {
        try {
          setLoading(true);
          
          console.log('Fetching invoices...');
          const response = await api.get('invoices/');
          
          // Process response data
          let invoicesArray = Array.isArray(response.data) 
            ? response.data
            : (response.data?.results && Array.isArray(response.data.results))
              ? response.data.results
              : [];
          
          console.log(`Fetched ${invoicesArray.length} invoices`);
          
          // Format the invoices data
          const formattedData = invoicesArray.map(invoice => {
            return {
              ...invoice,
              id: invoice.id,
            };
          });
          
          setInvoices(formattedData);
          setFilteredInvoices(formattedData);
          setLoading(false);
        } catch (error) {
          console.error('Error fetching invoices:', error);
          console.error('Error details:', error.response?.data);
          setLoading(false);
          message.error('Failed to load invoices. Please try again.');
        }
      };

      fetchInvoices();
    }
  }, [user, userRole, tenantId]);

  // Handle search
  const handleSearch = (query) => {
    setSearchQuery(query);
    applyFiltersAndSearch(query, activeFilters);
  };

  // Handle filter changes
  const handleFilterChange = (filters) => {
    setActiveFilters(filters);
    applyFiltersAndSearch(searchQuery, filters);
  };

  // Apply both filters and search
  const applyFiltersAndSearch = (query, filters) => {
    let results = [...invoices];
    
    // Apply search
    if (query) {
      const lowercasedQuery = query.toLowerCase();
      results = results.filter(invoice => 
        invoice.invoice_number?.toLowerCase().includes(lowercasedQuery) ||
        invoice.customer_name?.toLowerCase().includes(lowercasedQuery) ||
        invoice.customer_email?.toLowerCase().includes(lowercasedQuery) ||
        invoice.lead_name?.toLowerCase().includes(lowercasedQuery)
      );
    }
    
    // Apply status filter
    if (filters.status?.length) {
      results = results.filter(invoice => filters.status.includes(invoice.status));
    }
    
    setFilteredInvoices(results);
  };

  // Handle export
  const handleExport = (data, format, filename) => {
    // Basic CSV export implementation
    if (format === 'csv') {
      try {
        // Define headers based on columns
        const headers = columns.map(col => col.headerName);
        
        // Map data to rows
        const rows = data.map(item => {
          return columns.map(col => {
            const value = item[col.field];
            // Format dates
            if (col.field === 'created_at' || col.field === 'issue_date' || col.field === 'due_date') {
              return value ? new Date(value).toLocaleDateString() : '';
            }
            // Format monetary values
            if (col.field === 'total_amount' || col.field === 'paid_amount') {
              return value ? `$${parseFloat(value).toFixed(2)}` : '';
            }
            // Format display values
            if (col.field === 'status_display') {
              return value || '';
            }
            return value || '';
          });
        });
        
        // Combine headers and rows
        const csvContent = [
          headers.join(','),
          ...rows.map(row => row.join(','))
        ].join('\n');
        
        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        message.success(`Exported ${data.length} invoices as CSV`);
      } catch (error) {
        message.error('Failed to export data');
      }
    } else {
      message.info(`Export as ${format} is not implemented yet`);
    }
  };

  // Handle create new invoice
  const handleCreateInvoice = () => {
    navigate('/dashboard/invoices/create');
  };

  // Handle view invoice
  const handleViewInvoice = (invoice) => {
    navigate(`/dashboard/invoices/${invoice.id}/print`);
  };

  // Handle print invoice directly
  const handlePrintInvoice = (e, invoice) => {
    e.stopPropagation(); // Prevent row click
    navigate(`/dashboard/invoices/${invoice.id}/print`);
  };

  // Handle edit invoice
  const handleEditInvoice = (invoice) => {
    navigate(`/dashboard/invoices/${invoice.id}/edit`);
  };

  // Handle delete invoice
  const handleDeleteInvoice = async (invoice) => {
    try {
      // Show loading message
      message.loading('Deleting invoice...', 0);
      
      // Make the delete request
      await api.delete(`invoices/${invoice.id}/`);
      
      // Hide loading message
      message.destroy();
      
      // Show success message
      message.success(`Invoice #${invoice.invoice_number} deleted successfully`);
      
      // Update the invoices list by removing the deleted invoice
      const updatedInvoices = invoices.filter(item => item.id !== invoice.id);
      setInvoices(updatedInvoices);
      setFilteredInvoices(filteredInvoices.filter(item => item.id !== invoice.id));
    } catch (error) {
      // Hide loading message
      message.destroy();
      
      // Show error message
      message.error('Failed to delete invoice. Please try again.');
    }
  };

  // Refresh invoices
  const refreshInvoices = async () => {
    if (user && userRole && tenantId) {
      try {
        setLoading(true);
        
        console.log('Refreshing invoices...');
        const response = await api.get('invoices/');
        
        // Process response data
        let invoicesArray = Array.isArray(response.data) 
          ? response.data
          : (response.data?.results && Array.isArray(response.data.results))
            ? response.data.results
            : [];
        
        console.log(`Refreshed ${invoicesArray.length} invoices`);
        
        // Format the invoices data
        const formattedData = invoicesArray.map(invoice => {
          return {
            ...invoice,
            id: invoice.id,
          };
        });
        
        setInvoices(formattedData);
        setFilteredInvoices(formattedData);
        setLoading(false);
      } catch (error) {
        console.error('Error refreshing invoices:', error);
        setLoading(false);
        message.error('Failed to refresh invoices. Please try again.');
      }
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
                Invoices
              </Typography>
              
              <Stack direction="row" spacing={2}>
                <DownloadButton 
                  data={filteredInvoices}
                  filename="invoices"
                  onExport={handleExport}
                />
                <CreateButton 
                  onClick={handleCreateInvoice}
                  buttonText="Create Invoice"
                  icon="receipt"
                />
              </Stack>
            </Box>
            
            {/* Search and Filter Row */}
            <Box sx={{ display: 'flex', mb: 3, gap: 2 }}>
              <Box sx={{ flexGrow: 1 }}>
                <SearchBar 
                  placeholder="Search by invoice #, customer name, or lead..." 
                  onSearch={handleSearch}
                />
              </Box>
              <FilterButton 
                filters={filterOptions}
                onFilterChange={handleFilterChange}
              />
            </Box>
            
            {/* Show TableSkeleton during loading, TableList when data is ready */}
            {loading ? (
              <TableSkeleton 
                columns={columns.length} 
                rows={10} 
                dense={false} 
              />
            ) : (
              <TableList
                columns={columns}
                data={filteredInvoices}
                loading={false}
                onRowClick={handleViewInvoice}
                onEditClick={handleEditInvoice}
                onDeleteClick={handleDeleteInvoice}
                extraActions={(row) => (
                  <Tooltip title="View/Print Invoice" key="print">
                    <IconButton
                      color="primary"
                      size="small"
                      onClick={(e) => handlePrintInvoice(e, row)}
                    >
                      <PrintIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                pagination={true}
                rowsPerPage={10}
                defaultSortField="created_at"
                defaultSortDirection="desc"
              />
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default InvoiceIndex; 