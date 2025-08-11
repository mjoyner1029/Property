// frontend/src/pages/Messages.jsx
import React, { useEffect, useState, useRef } from "react";
import { socket } from "../utils/socket";
import axios from "axios";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Container,
  IconButton,
  InputAdornment
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";

const Messages = ({ userId, receiverId, propertyId }) => {
  const [room] = useState(`room-${userId}-${receiverId}-${propertyId}`);
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    socket.emit("join", { room });
    socket.on("receive_message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      socket.emit("leave", { room });
      socket.off("receive_message");
    };
  }, [room]);

  useEffect(() => {
    const fetchMessages = async () => {
      const res = await axios.get(
        `/api/messages/conversation?sender_id=${userId}&receiver_id=${receiverId}&property_id=${propertyId}`
      );
      setMessages(res.data);
    };
    fetchMessages();
  }, [userId, receiverId, propertyId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async () => {
    if (!content.trim()) return;
    const msg = {
      sender_id: userId,
      receiver_id: receiverId,
      property_id: propertyId,
      content,
    };
    await axios.post("/api/messages/", msg);
    socket.emit("send_message", { ...msg, room });
    setContent("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Box sx={{ maxWidth: 800, mx: "auto" }}>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
          Chat
        </Typography>
        
        <Paper 
          elevation={0}
          sx={{ 
            height: 400, 
            p: 2, 
            mb: 2, 
            overflowY: "auto",
            backgroundColor: "background.default",
            boxShadow: '0px 2px 8px rgba(0,0,0,0.05)',
            borderRadius: 3
          }}
        >
          {messages.map((message, index) => (
            <Box 
              key={index} 
              sx={{ 
                display: "flex", 
                justifyContent: message.sender_id === userId ? "flex-end" : "flex-start",
                mb: 1.5
              }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: 1.5,
                  maxWidth: "70%",
                  borderRadius: 3,
                  backgroundColor: message.sender_id === userId 
                    ? "primary.main" 
                    : "background.paper",
                  color: message.sender_id === userId 
                    ? "primary.contrastText" 
                    : "text.primary",
                  boxShadow: '0px 1px 3px rgba(0,0,0,0.05)'
                }}
              >
                <Typography variant="body2">
                  {message.content}
                </Typography>
                <Typography 
                  variant="caption" 
                  color={message.sender_id === userId ? "primary.light" : "text.secondary"}
                  sx={{ display: "block", mt: 0.5, opacity: 0.8 }}
                >
                  {message.timestamp 
                    ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : ""}
                </Typography>
              </Paper>
            </Box>
          ))}
          <div ref={messagesEndRef} />
        </Paper>
        
        <Box sx={{ display: "flex", mt: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Type your message..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyPress={handleKeyPress}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px 0 0 12px",
                backgroundColor: "background.paper"
              }
            }}
            InputProps={{
              sx: { pr: 0 }
            }}
          />
          <Button
            variant="contained"
            color="primary"
            disabled={!content.trim()}
            onClick={sendMessage}
            sx={{ 
              borderRadius: "0 12px 12px 0",
              minWidth: 64
            }}
          >
            <SendIcon />
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default Messages;