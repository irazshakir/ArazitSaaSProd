import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider, createTheme, StyledEngineProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Import the AppRoutes component
import AppRoutes from './routes/index';

// Create a theme instance
const theme = createTheme({
  typography: {
    fontFamily: [
      'Montserrat',
      'Open Sans',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontFamily: 'Montserrat, sans-serif',
      fontWeight: 600,
    },
    h2: {
      fontFamily: 'Montserrat, sans-serif',
      fontWeight: 600,
    },
    h3: {
      fontFamily: 'Montserrat, sans-serif',
      fontWeight: 600,
    },
    h4: {
      fontFamily: 'Montserrat, sans-serif',
      fontWeight: 600,
    },
    h5: {
      fontFamily: 'Montserrat, sans-serif',
      fontWeight: 600,
    },
    h6: {
      fontFamily: 'Montserrat, sans-serif',
      fontWeight: 600,
    },
    subtitle1: {
      fontFamily: 'Open Sans, sans-serif',
    },
    subtitle2: {
      fontFamily: 'Open Sans, sans-serif',
    },
    body1: {
      fontFamily: 'Open Sans, sans-serif',
    },
    body2: {
      fontFamily: 'Open Sans, sans-serif',
    },
    button: {
      fontFamily: 'Montserrat, sans-serif',
      fontWeight: 500,
    },
  },
  palette: {
    primary: {
      main: '#9d277c',
      light: '#b53277',
      dark: '#85114e',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#c34387',
      light: '#f7a6f7',
      dark: '#770577',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F5F7FA',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          padding: '10px 22px',
        },
        containedPrimary: {
          boxShadow: '0 4px 14px 0 rgba(0, 120, 255, 0.39)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#ffffff',
            '& fieldset': {
              borderColor: '#e0e0e0',
            },
            '&:hover fieldset': {
              borderColor: '#9d277c',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#9d277c',
            },
          },
          '& .MuiInputBase-input::placeholder': {
            color: '#9e9e9e',
            opacity: 1,
          },
          '& .MuiInputBase-input': {
            color: '#424242',
          },
        },
      },
    },
  },
});

function App() {
  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <AppRoutes />
        </Router>
      </ThemeProvider>
    </StyledEngineProvider>
  );
}

export default App; 