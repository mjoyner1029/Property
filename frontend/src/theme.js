import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#e26757', // Coral red from the images
      light: '#f1b0a2',
      dark: '#c05046',
    },
    secondary: {
      main: '#e8c570', // Yellow/gold accent
      light: '#ffe9a6',
      dark: '#c19643',
    },
    background: {
      default: '#f8e1da', // Soft peach background
      paper: '#ffffff',
    },
    text: {
      primary: '#4a3937', // Dark brown text
      secondary: '#7d6461', // Lighter brown text
    },
    error: {
      main: '#f44336',
    },
    warning: {
      main: '#ff9800',
    },
    info: {
      main: '#2196f3',
    },
    success: {
      main: '#4caf50',
    },
  },
});

export default theme;