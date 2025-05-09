import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ConfigProvider } from 'antd';
import App from './App.jsx'
import './index.css'
import 'antd/dist/reset.css';
import './styles/mobileStyles.css';

// Configure Ant Design
ConfigProvider.config({
  theme: {
    // Your theme settings (if any)
  },
  // Enable compatibility mode to work with React 19
  compatible: true,
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <StyledEngineProvider injectFirst>
      <ConfigProvider>
        <App />
      </ConfigProvider>
    </StyledEngineProvider>
  </React.StrictMode>,
) 