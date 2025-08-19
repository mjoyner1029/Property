import React from 'react';
import { Box, Typography, Container } from '@mui/material';
import PageHeader from '../components/PageHeader';

const Terms = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 3 }}>
        <PageHeader title="Terms of Service" />
        <Typography variant="body1" paragraph>
          Terms and conditions page content will be added soon.
        </Typography>
      </Box>
    </Container>
  );
};

export default Terms;
