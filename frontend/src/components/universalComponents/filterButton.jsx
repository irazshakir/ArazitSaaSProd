import React, { useState } from 'react';
import { 
  Button, 
  Menu, 
  MenuItem, 
  Checkbox, 
  FormGroup, 
  FormControlLabel,
  Typography,
  Divider,
  Box
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';

const FilterButton = ({ 
  filters = [], // Array of filter objects with options
  onFilterChange,
  buttonText = 'Filter'
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedFilters, setSelectedFilters] = useState({});
  
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleFilterChange = (filterGroup, option) => {
    const newFilters = { ...selectedFilters };
    
    // Initialize filter group if not exists
    if (!newFilters[filterGroup]) {
      newFilters[filterGroup] = [];
    }
    
    // Toggle selection
    if (newFilters[filterGroup].includes(option)) {
      newFilters[filterGroup] = newFilters[filterGroup].filter(item => item !== option);
    } else {
      newFilters[filterGroup].push(option);
    }
    
    setSelectedFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleClearFilters = () => {
    setSelectedFilters({});
    onFilterChange({});
    handleClose();
  };

  const isFilterActive = Object.values(selectedFilters).some(group => group.length > 0);

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<FilterListIcon />}
        onClick={handleClick}
        color={isFilterActive ? "primary" : "inherit"}
        sx={{
          borderRadius: '8px',
          borderColor: isFilterActive ? 'primary.main' : 'grey.300',
          backgroundColor: 'white',
          textTransform: 'none',
          color: isFilterActive ? 'primary.main' : 'text.secondary',
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
          },
        }}
      >
        {buttonText}
      </Button>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: { 
            width: 250,
            maxHeight: 400,
            mt: 1
          }
        }}
      >
        {filters.map((filterGroup, index) => (
          <Box key={filterGroup.name}>
            {index > 0 && <Divider />}
            <Typography 
              variant="subtitle2" 
              sx={{ px: 2, py: 1, fontWeight: 'bold', backgroundColor: 'grey.100' }}
            >
              {filterGroup.label}
            </Typography>
            
            <FormGroup sx={{ px: 2, py: 1 }}>
              {filterGroup.options.map(option => (
                <FormControlLabel
                  key={option.value}
                  control={
                    <Checkbox
                      size="small"
                      checked={selectedFilters[filterGroup.name]?.includes(option.value) || false}
                      onChange={() => handleFilterChange(filterGroup.name, option.value)}
                    />
                  }
                  label={<Typography variant="body2">{option.label}</Typography>}
                />
              ))}
            </FormGroup>
          </Box>
        ))}
        
        {isFilterActive && (
          <>
            <Divider />
            <MenuItem onClick={handleClearFilters}>
              <Typography 
                variant="body2" 
                color="primary" 
                sx={{ width: '100%', textAlign: 'center' }}
              >
                Clear All Filters
              </Typography>
            </MenuItem>
          </>
        )}
      </Menu>
    </>
  );
};

export default FilterButton;
