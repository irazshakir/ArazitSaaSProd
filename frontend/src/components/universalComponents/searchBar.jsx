import React, { useState } from 'react';
import { Box, TextField, IconButton, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

const SearchBar = ({ placeholder = 'Quick search...', onSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearch(value);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    onSearch('');
  };

  return (
    <Box sx={{ width: '100%' }}>
      <TextField
        fullWidth
        variant="outlined"
        value={searchQuery}
        onChange={handleSearchChange}
        placeholder={placeholder}
        size="small"
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
            backgroundColor: '#ffffff',
          }
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
          endAdornment: searchQuery ? (
            <InputAdornment position="end">
              <IconButton
                edge="end"
                onClick={handleClearSearch}
                size="small"
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ) : null,
        }}
      />
    </Box>
  );
};

export default SearchBar;
