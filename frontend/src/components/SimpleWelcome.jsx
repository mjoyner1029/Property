import React from 'react';
import { Typography, Container } from '@mui/material';

const SimpleWelcome = () => {
  return (
    <Container maxWidth="sm" style={{ marginTop: '50px', textAlign: 'center' }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Welcome to Property App
      </Typography>
      <Typography variant="h6" color="textSecondary" paragraph>
        🎉 Frontend and Backend are connected successfully!
      </Typography>
      <Typography variant="body1" color="textSecondary">
        The application is loading properly.
      </Typography>
    </Container>
  );
};

export default SimpleWelcome;
