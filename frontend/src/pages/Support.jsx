import React, { useState } from "react";
import { 
  Box, 
  Typography, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails,
  TextField,
  Button,
  Paper,
  Divider,
  Grid,
  Alert,
  Container
} from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SendIcon from '@mui/icons-material/Send';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import PageHeader from "../components/PageHeader";

const Support = () => {
  const [contactForm, setContactForm] = useState({
    email: '',
    message: '',
  });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFormChange = (e) => {
    setContactForm({
      ...contactForm,
      [e.target.name]: e.target.value
    });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    
    // Validate form
    if (!contactForm.email || !contactForm.message) {
      setFormError('Please fill out all fields');
      return;
    }
    
    setLoading(true);
    
    // Submit form - replace with actual API call
    setTimeout(() => {
      setFormSubmitted(true);
      setFormError('');
      setContactForm({ email: '', message: '' });
      setLoading(false);
    }, 1000);
  };

  const faqs = [
    {
      question: "How do I reset my password?",
      answer: "You can reset your password by clicking on the 'Forgot Password' link on the login page. You will receive an email with instructions to reset your password."
    },
    {
      question: "How do I contact my landlord?",
      answer: "You can contact your landlord through the messaging system in the app. Go to your property details page and click on the 'Contact Landlord' button."
    },
    {
      question: "How do I upload documents?",
      answer: "You can upload documents by going to the 'Documents' section in your property dashboard. Click on the 'Upload' button and select the files you want to upload."
    },
    {
      question: "How do I submit a maintenance request?",
      answer: "You can submit a maintenance request by going to the 'Maintenance' section and clicking on the 'New Request' button. Fill out the form with details about the issue."
    },
    {
      question: "How do I pay my rent online?",
      answer: "You can pay your rent online by going to the 'Pay Rent' section. You can set up automatic payments or make one-time payments using your preferred payment method."
    }
  ];

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 3 }}>
        <PageHeader title="Support & Help" />
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 3,
                boxShadow: '0px 2px 8px rgba(0,0,0,0.05)',
                borderRadius: 3
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <HelpOutlineIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight={600}>
                  Frequently Asked Questions
                </Typography>
              </Box>
              
              <Box sx={{ mt: 2 }}>
                {faqs.map((faq, index) => (
                  <Accordion 
                    key={index}
                    elevation={0}
                    sx={{ 
                      mb: 1,
                      boxShadow: 'none',
                      '&:before': { display: 'none' },
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: '12px !important',
                      overflow: 'hidden'
                    }}
                  >
                    <AccordionSummary 
                      expandIcon={<ExpandMoreIcon />}
                      sx={{ 
                        backgroundColor: 'background.paperAlt',
                        '&.Mui-expanded': {
                          borderBottom: '1px solid',
                          borderColor: 'divider'
                        }
                      }}
                    >
                      <Typography fontWeight={500}>{faq.question}</Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ py: 2 }}>
                      <Typography variant="body2">{faq.answer}</Typography>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 3,
                boxShadow: '0px 2px 8px rgba(0,0,0,0.05)',
                borderRadius: 3
              }}
            >
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Contact Support
              </Typography>
              
              <Box component="form" onSubmit={handleFormSubmit} sx={{ mt: 2 }}>
                {formSubmitted && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    Your message has been sent! We'll get back to you soon.
                  </Alert>
                )}
                {formError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {formError}
                  </Alert>
                )}
                <TextField
                  fullWidth
                  label="Your Email"
                  name="email"
                  type="email"
                  value={contactForm.email}
                  onChange={handleFormChange}
                  margin="normal"
                  required
                  InputProps={{
                    sx: { borderRadius: 2 }
                  }}
                />
                <TextField
                  fullWidth
                  label="How can we help?"
                  name="message"
                  multiline
                  rows={4}
                  value={contactForm.message}
                  onChange={handleFormChange}
                  margin="normal"
                  required
                  InputProps={{
                    sx: { borderRadius: 2 }
                  }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={loading}
                  startIcon={<SendIcon />}
                  sx={{ 
                    mt: 2,
                    py: 1.5,
                    borderRadius: 2
                  }}
                >
                  {loading ? 'Sending...' : 'Send Message'}
                </Button>
              </Box>
            </Paper>
            
            <Paper 
              elevation={0}
              sx={{ 
                mt: 3,
                p: 3,
                boxShadow: '0px 2px 8px rgba(0,0,0,0.05)',
                borderRadius: 3
              }}
            >
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Contact Information
              </Typography>
              <Divider sx={{ my: 1.5 }} />
              
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <EmailIcon sx={{ mr: 1.5, color: 'text.secondary', fontSize: 20 }} />
                  <Typography variant="body2">
                    support@assetanchor.com
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PhoneIcon sx={{ mr: 1.5, color: 'text.secondary', fontSize: 20 }} />
                  <Typography variant="body2">
                    (555) 123-4567
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AccessTimeIcon sx={{ mr: 1.5, color: 'text.secondary', fontSize: 20 }} />
                  <Typography variant="body2">
                    Monday - Friday, 9AM - 5PM EST
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default Support;