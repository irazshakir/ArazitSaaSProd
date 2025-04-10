import React, { useState, useEffect } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Typography,
  IconButton,
  Avatar,
  Chip,
  TableSortLabel,
  Paper,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import EnhancedPagination from './enhancedPagination';

const TableList = ({
  columns = [],
  data = [],
  onRowClick,
  onViewClick,
  onEditClick,
  onDeleteClick,
  extraActions,
  selectable = true,
  pagination = true,
  rowsPerPage = 10,
  rowsPerPageOptions = [5, 10, 25, 50],
  defaultSortField = '',
  defaultSortDirection = 'asc',
  getRowHighlight = null
}) => {
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState(defaultSortField);
  const [sortDirection, setSortDirection] = useState(defaultSortDirection);
  const [localRowsPerPage, setLocalRowsPerPage] = useState(rowsPerPage);
  
  // State for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  
  // Reset page when data changes
  useEffect(() => {
    setPage(1);
  }, [data]);
  
  // Handle row selection
  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = data.map((row) => row.id);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  const handleSelectClick = (event, id) => {
    event.stopPropagation();
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1)
      );
    }

    setSelected(newSelected);
  };

  const isSelected = (id) => selected.indexOf(id) !== -1;

  // Handle sorting
  const handleRequestSort = (field) => {
    const isAsc = sortField === field && sortDirection === 'asc';
    setSortDirection(isAsc ? 'desc' : 'asc');
    setSortField(field);
  };

  // Handle pagination
  const handleChangePage = (event, newPage) => {
    if (newPage >= 1 && newPage <= Math.ceil(data.length / localRowsPerPage)) {
      setPage(newPage);
    }
  };
  
  // Handle rows per page change
  const handleRowsPerPageChange = (newRowsPerPage) => {
    setLocalRowsPerPage(newRowsPerPage);
    setPage(1); // Reset to first page when changing rows per page
  };

  // Apply sorting to data
  const sortedData = React.useMemo(() => {
    if (!sortField) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      // Handle different data types
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (aValue === null || aValue === undefined) return sortDirection === 'asc' ? -1 : 1;
      if (bValue === null || bValue === undefined) return sortDirection === 'asc' ? 1 : -1;

      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });
  }, [data, sortField, sortDirection]);

  // Apply pagination
  const paginatedData = React.useMemo(() => {
    if (!pagination) return sortedData;
    const startIndex = (page - 1) * localRowsPerPage;
    const endIndex = startIndex + localRowsPerPage;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, page, localRowsPerPage, pagination]);

  // Render cell content based on type
  const renderCellContent = (column, value, row) => {
    // If the column has a custom render function, use it
    if (column.render) {
      return column.render(value, row);
    }

    // Handle different data types
    switch (column.type) {
      case 'avatar':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar 
              src={row.avatar || value} 
              alt={row.name || ''}
              sx={{ width: 36, height: 36, mr: 2 }}
            />
            {column.showName && (
              <Typography variant="body2" component="span">
                {row.name || row.firstName || ''}
                {row.lastName && ` ${row.lastName}`}
              </Typography>
            )}
          </Box>
        );
      
      case 'status':
        return (
          <Chip 
            label={value}
            size="small"
            color={
              value?.toLowerCase() === 'active' ? 'success' :
              value?.toLowerCase() === 'blocked' ? 'error' :
              'default'
            }
            sx={{ 
              borderRadius: '4px',
              backgroundColor: 
                value?.toLowerCase() === 'active' ? 'rgba(46, 204, 113, 0.2)' :
                value?.toLowerCase() === 'blocked' ? 'rgba(231, 76, 60, 0.2)' :
                'rgba(189, 189, 189, 0.2)',
              color: 
                value?.toLowerCase() === 'active' ? 'rgb(46, 204, 113)' :
                value?.toLowerCase() === 'blocked' ? 'rgb(231, 76, 60)' :
                'text.secondary',
              fontWeight: 500
            }}
          />
        );
        
      case 'currency':
        return typeof value === 'number' 
          ? `$${value.toFixed(2)}` 
          : value;
      
      default:
        return value;
    }
  };

  // Handle delete dialog open
  const handleDeleteClick = (event, row) => {
    event.stopPropagation();
    setItemToDelete(row);
    setDeleteDialogOpen(true);
  };
  
  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (itemToDelete && onDeleteClick) {
      onDeleteClick(itemToDelete);
    }
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };
  
  // Handle delete dialog close
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Paper 
        elevation={0} 
        sx={{ 
          width: '100%', 
          borderRadius: '12px',
          overflow: 'hidden',
          border: '1px solid rgba(0, 0, 0, 0.1)'
        }}
      >
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table 
            stickyHeader 
            aria-label="data table"
            sx={{ tableLayout: 'fixed', width: '100%' }}
          >
            <TableHead>
              <TableRow>
                {selectable && (
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={selected.length > 0 && selected.length < data.length}
                      checked={data.length > 0 && selected.length === data.length}
                      onChange={handleSelectAllClick}
                    />
                  </TableCell>
                )}
                
                {columns.map((column) => (
                  <TableCell
                    key={column.field}
                    align={column.align || 'left'}
                    sortDirection={sortField === column.field ? sortDirection : false}
                    style={{ 
                      minWidth: column.minWidth,
                      maxWidth: column.maxWidth,
                      width: column.width,
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      color: 'rgba(0, 0, 0, 0.6)'
                    }}
                  >
                    {column.sortable !== false ? (
                      <TableSortLabel
                        active={sortField === column.field}
                        direction={sortField === column.field ? sortDirection : 'asc'}
                        onClick={() => handleRequestSort(column.field)}
                      >
                        {column.headerName || column.field}
                      </TableSortLabel>
                    ) : (
                      column.headerName || column.field
                    )}
                  </TableCell>
                ))}
                
                {(onViewClick || onEditClick || onDeleteClick || extraActions) && (
                  <TableCell 
                    align="right" 
                    style={{ 
                      width: '15%', 
                      minWidth: 100 
                    }}
                  >
                    Actions
                  </TableCell>
                )}
              </TableRow>
            </TableHead>
            
            <TableBody>
              {paginatedData.map((row, index) => {
                const isItemSelected = isSelected(row.id);
                
                return (
                  <TableRow
                    hover
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    role="checkbox"
                    aria-checked={isItemSelected}
                    tabIndex={-1}
                    key={row.id || index}
                    selected={isItemSelected}
                    sx={{ 
                      cursor: onRowClick ? 'pointer' : 'default',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                      },
                      ...getRowHighlight?.(row),
                    }}
                  >
                    {selectable && (
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={isItemSelected}
                          onClick={(event) => handleSelectClick(event, row.id)}
                        />
                      </TableCell>
                    )}
                    
                    {columns.map((column) => (
                      <TableCell 
                        key={`${row.id}-${column.field}`}
                        align={column.align || 'left'}
                      >
                        {renderCellContent(column, row[column.field], row)}
                      </TableCell>
                    ))}
                    
                    {(onViewClick || onEditClick || onDeleteClick || extraActions) && (
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                          {extraActions && extraActions(row)}
                          
                          {onEditClick && (
                            <IconButton 
                              size="small" 
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditClick(row);
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          )}
                          
                          {onDeleteClick && (
                            <IconButton 
                              size="small" 
                              onClick={(e) => handleDeleteClick(e, row)}
                              sx={{ color: 'error.main' }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
              
              {data.length === 0 && (
                <TableRow>
                  <TableCell 
                    colSpan={columns.length + (selectable ? 1 : 0) + ((onViewClick || onEditClick || onDeleteClick || extraActions) ? 1 : 0)} 
                    align="center"
                    sx={{ py: 3 }}
                  >
                    <Typography variant="body1" color="text.secondary">
                      No data available
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {pagination && data.length > 0 && (
          <EnhancedPagination
            totalItems={data.length}
            page={page}
            rowsPerPage={localRowsPerPage}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleRowsPerPageChange}
            rowsPerPageOptions={rowsPerPageOptions}
          />
        )}
      </Paper>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete {itemToDelete?.package_name || itemToDelete?.name || 'this item'}? 
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TableList;
