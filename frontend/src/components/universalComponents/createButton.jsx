import React from 'react';
import { Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

const CreateButton = ({ 
  onClick, 
  buttonText = 'Add new', 
  icon = 'default',
  color = 'primary',
  variant = 'contained',
  fullWidth = false,
  size = 'medium'
}) => {
  // Choose the appropriate icon based on the icon prop
  const getIcon = () => {
    switch (icon) {
      case 'person':
        return <PersonAddIcon />;
      case 'default':
      default:
        return <AddIcon />;
    }
  };

  return (
    <Button
      variant={variant}
      color={color}
      startIcon={getIcon()}
      onClick={onClick}
      fullWidth={fullWidth}
      size={size}
      sx={{
        borderRadius: '8px',
        textTransform: 'none',
        fontWeight: 'medium',
        py: 1,
        px: 2
      }}
    >
      {buttonText}
    </Button>
  );
};

export default CreateButton;
