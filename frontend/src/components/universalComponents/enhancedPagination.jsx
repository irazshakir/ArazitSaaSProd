import React from 'react';
import { 
  Box, 
  Pagination, 
  Typography, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel,
  Stack,
  Divider
} from '@mui/material';

const EnhancedPagination = ({
  totalItems,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  rowsPerPageOptions = [5, 10, 25, 50],
  showRowsPerPage = true,
  showTotalItems = true,
  showPageInfo = true,
  color = 'primary',
  size = 'medium'
}) => {
  // Calculate pagination info
  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));
  const validPage = Math.min(Math.max(1, page), totalPages);
  const startItem = totalItems === 0 ? 0 : (validPage - 1) * rowsPerPage + 1;
  const endItem = Math.min(validPage * rowsPerPage, totalItems);
  
  console.log(`EnhancedPagination: totalItems=${totalItems}, page=${validPage}, rowsPerPage=${rowsPerPage}, totalPages=${totalPages}`);
  console.log(`EnhancedPagination: Showing items ${startItem}-${endItem} of ${totalItems}`);
  
  // Handle page change
  const handlePageChange = (event, newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      console.log(`EnhancedPagination: Page changed to ${newPage}`);
      onPageChange(event, newPage);
    }
  };
  
  // Handle rows per page change
  const handleRowsPerPageChange = (event) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    console.log(`EnhancedPagination: Rows per page changed to ${newRowsPerPage}`);
    onRowsPerPageChange(newRowsPerPage);
  };
  
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: { xs: 'column', sm: 'row' },
      alignItems: { xs: 'center', sm: 'center' },
      justifyContent: 'space-between',
      p: 2,
      borderTop: '1px solid rgba(0, 0, 0, 0.1)',
      gap: 2
    }}>
      {/* Left side - Rows per page selector and total items info */}
      <Stack 
        direction={{ xs: 'column', sm: 'row' }} 
        spacing={2} 
        alignItems="center"
        sx={{ width: { xs: '100%', sm: 'auto' } }}
      >
        {showRowsPerPage && (
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="rows-per-page-label">Rows per page</InputLabel>
            <Select
              labelId="rows-per-page-label"
              value={rowsPerPage}
              label="Rows per page"
              onChange={handleRowsPerPageChange}
            >
              {rowsPerPageOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        
        {showTotalItems && (
          <Typography variant="body2" color="text.secondary">
            Total: {totalItems} items
          </Typography>
        )}
      </Stack>
      
      {/* Center - Pagination controls */}
      <Pagination 
        count={totalPages} 
        page={validPage} 
        onChange={handlePageChange} 
        color={color}
        size={size}
        showFirstButton
        showLastButton
      />
      
      {/* Right side - Page info */}
      {showPageInfo && (
        <Typography variant="body2" color="text.secondary">
          {totalItems === 0 
            ? 'No items' 
            : `Showing ${startItem}-${endItem} of ${totalItems}`}
        </Typography>
      )}
    </Box>
  );
};

export default EnhancedPagination; 