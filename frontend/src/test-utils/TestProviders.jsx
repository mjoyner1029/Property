// TestProviders: Wraps children in all necessary context providers for tests
import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../theme';

export default function TestProviders({ children }) {
	return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
