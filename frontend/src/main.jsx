import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import 'antd/dist/reset.css';
import { ConfigProvider } from 'antd';

ConfigProvider.config({
  theme: {
    // Your theme settings (if any)
  },
  // Enable compatibility mode to work with React 19
  compatible: true,
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
) 