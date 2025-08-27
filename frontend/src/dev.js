import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import theme from './theme';
import DevPageViewer from './DevPageViewer';
import DevContextProvider from './DevContextProvider';

/**
 * Development Mode Entry Point
 * This file provides a standalone development environment for viewing pages
 * without needing to log in or connect to a backend.
 */
const DevApp = () => {
  return (
    <DevContextProvider>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        <DevPageViewer />
      </MuiThemeProvider>
    </DevContextProvider>
  );
};

const rootElement = document.getElementById('root');
const root = createRoot(rootElement);
root.render(<DevApp />);
