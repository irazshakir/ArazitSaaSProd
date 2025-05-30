import React, { useState } from 'react';
import { 
  Button, 
  Menu, 
  MenuItem, 
  ListItemIcon, 
  ListItemText,
  Typography
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TableViewIcon from '@mui/icons-material/TableView';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';

const DownloadButton = ({ 
  data, 
  filename = 'export',
  onExport,
  buttonText = 'Download'
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleExport = (format) => {
    if (onExport) {
      onExport(data, format, filename);
    } else {
      // Default export handling if no custom handler provided
      console.log(`Exporting data as ${format}...`);
      // Here you would implement default export logic
      // For CSV, Excel, PDF exports
    }
    handleClose();
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<DownloadIcon />}
        onClick={handleClick}
        sx={{
          borderRadius: '8px',
          borderColor: 'grey.300',
          backgroundColor: 'white',
          textTransform: 'none',
          color: 'text.secondary',
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
          sx: { width: 200, mt: 1 }
        }}
      >
        <Typography variant="subtitle2" sx={{ px: 2, py: 1, color: 'text.secondary' }}>
          Export as
        </Typography>
        
        <MenuItem onClick={() => handleExport('csv')}>
          <ListItemIcon>
            <TableViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="CSV" />
        </MenuItem>
        
        <MenuItem onClick={() => handleExport('excel')}>
          <ListItemIcon>
            <InsertDriveFileIcon fontSize="small" style={{ color: '#217346' }} />
          </ListItemIcon>
          <ListItemText primary="Excel" />
        </MenuItem>
        
        <MenuItem onClick={() => handleExport('pdf')}>
          <ListItemIcon>
            <PictureAsPdfIcon fontSize="small" style={{ color: '#F40F02' }} />
          </ListItemIcon>
          <ListItemText primary="PDF" />
        </MenuItem>
      </Menu>
    </>
  );
};

export default DownloadButton;
