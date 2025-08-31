// frontend/src/pages/MessagesPage.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Container,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Button
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth, useApp } from "../context";
import Messages from "./Messages";
import SearchIcon from "@mui/icons-material/Search";
import PersonIcon from "@mui/icons-material/Person";
import GroupIcon from "@mui/icons-material/Group";
import axios from "axios";

const MessagesPage = () => {
  const navigate = useNavigate();
  const { updatePageTitle } = useApp();
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedConversation, setSelectedConversation] = useState(null);
  
  useEffect(() => {
    updatePageTitle("Messages");
    fetchConversations();
  }, [updatePageTitle]);
  
  const fetchConversations = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/messages/conversations");
      setConversations(res.data);
    } catch (err) {
      console.error("Error fetching conversations:", err);
      setError("Failed to load conversations");
    } finally {
      setLoading(false);
    }
  };
  
  const handleConversationClick = (conversation) => {
    setSelectedConversation(conversation);
  };
  
  const filteredConversations = conversations.filter(conv => 
    conv.participant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.property_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Grid container spacing={3}>
        {/* Conversations List */}
        <Grid item xs={12} md={4} lg={3}>
          <Paper
            elevation={0}
            sx={{
              height: "75vh",
              borderRadius: 2,
              display: "flex",
              flexDirection: "column"
            }}
          >
            <Box p={2} borderBottom="1px solid" borderColor="divider">
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" fontWeight={600}>
                  Conversations
                </Typography>
                <Button 
                  variant="contained" 
                  size="small" 
                  onClick={() => navigate('/messages/new')}
                >
                  New
                </Button>
              </Box>
              <TextField
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                margin="dense"
                size="small"
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" color="action" />
                    </InputAdornment>
                  )
                }}
                sx={{ mt: 1 }}
              />
            </Box>
            
            <Box sx={{ overflowY: "auto", flexGrow: 1 }}>
              {loading ? (
                <Box display="flex" justifyContent="center" p={4}>
                  <CircularProgress size={28} />
                </Box>
              ) : error ? (
                <Alert severity="error" sx={{ m: 2 }}>
                  {error}
                </Alert>
              ) : filteredConversations.length === 0 ? (
                <Box p={3} textAlign="center" color="text.secondary">
                  <Typography variant="body2">
                    {searchTerm ? "No matching conversations" : "No conversations yet"}
                  </Typography>
                </Box>
              ) : (
                <List disablePadding>
                  {filteredConversations.map((conv, index) => (
                    <React.Fragment key={conv.id}>
                      <ListItem
                        button
                        selected={selectedConversation?.id === conv.id}
                        onClick={() => handleConversationClick(conv)}
                        sx={{ px: 2, py: 1.5 }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: conv.is_group ? 'primary.main' : 'secondary.main' }}>
                            {conv.is_group ? <GroupIcon /> : <PersonIcon />}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={conv.participant_name || "Unknown"}
                          secondary={conv.property_name || "General"}
                          primaryTypographyProps={{
                            fontWeight: conv.unread ? 600 : 400,
                            noWrap: true
                          }}
                          secondaryTypographyProps={{
                            noWrap: true
                          }}
                        />
                        {conv.unread > 0 && (
                          <Box
                            sx={{
                              bgcolor: 'primary.main',
                              color: 'white',
                              borderRadius: '50%',
                              width: 22,
                              height: 22,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.75rem'
                            }}
                          >
                            {conv.unread}
                          </Box>
                        )}
                      </ListItem>
                      {index < filteredConversations.length - 1 && (
                        <Divider component="li" />
                      )}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Box>
          </Paper>
        </Grid>
        
        {/* Message Thread */}
        <Grid item xs={12} md={8} lg={9}>
          <Paper
            elevation={0}
            sx={{
              height: "75vh",
              borderRadius: 2,
              display: "flex",
              flexDirection: "column"
            }}
          >
            {selectedConversation ? (
              <Messages
                userId={user?.id}
                receiverId={selectedConversation.participant_id}
                propertyId={selectedConversation.property_id}
              />
            ) : (
              <Box
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
                height="100%"
                color="text.secondary"
              >
                <PersonIcon sx={{ fontSize: 60, opacity: 0.3, mb: 2 }} />
                <Typography variant="h6">Select a conversation</Typography>
                <Typography variant="body2">
                  Choose a conversation from the list to start messaging
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default MessagesPage;
