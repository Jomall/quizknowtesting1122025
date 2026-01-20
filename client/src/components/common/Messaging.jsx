import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  TextField,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Badge,
  Fab,
} from '@mui/material';
import {
  Send as SendIcon,
  Message as MessageIcon,
  Close as CloseIcon,
  Chat as ChatIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const Messaging = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const { user } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (open) {
      loadConversations();
    }
  }, [open]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Conversations loaded:', response.data.data);
      console.log('Current user:', user);
      response.data.data.forEach((conv, index) => {
        console.log(`Conversation ${index}:`, {
          user: conv.user._id,
          lastMessage: conv.lastMessage,
          unreadCount: conv.unreadCount
        });
      });
      setConversations(response.data.data);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  }, [user]);

  const loadMessages = async (userId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/messages/conversation/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(response.data.data);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    loadMessages(conversation.user._id);

    // Dispatch custom event to notify dashboard of message read
    window.dispatchEvent(new CustomEvent('messagesRead'));
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/messages`, {
        receiverId: selectedConversation.user._id,
        content: newMessage.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setNewMessage('');
      loadMessages(selectedConversation.user._id);
      loadConversations(); // Refresh conversations to update last message
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleDeleteConversation = async (conversation) => {
    if (!window.confirm(`Are you sure you want to delete the conversation with ${getDisplayName(conversation.user)}? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/messages/conversation/${conversation.user._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // If the deleted conversation was selected, clear selection
      if (selectedConversation?.user._id === conversation.user._id) {
        setSelectedConversation(null);
        setMessages([]);
      }

      // Refresh conversations list
      loadConversations();

      // Dispatch custom event to notify dashboard of conversation deletion
      window.dispatchEvent(new CustomEvent('messagesRead'));
    } catch (error) {
      console.error('Error deleting conversation:', error);
      alert('Failed to delete conversation. Please try again.');
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  const getDisplayName = (user) => {
    return user?.profile?.firstName && user?.profile?.lastName
      ? `${user.profile.firstName} ${user.profile.lastName}`
      : user?.username || 'Unknown User';
  };

  return (
    <>
      <Fab
        color="primary"
        aria-label="messages"
        onClick={() => setOpen(true)}
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
      >
        <Badge badgeContent={conversations.filter(c => c.unreadCount > 0).length} color="error">
          <ChatIcon />
        </Badge>
      </Fab>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="md"
        fullWidth
        sx={{ '& .MuiDialog-paper': { height: '80vh' } }}
      >
        <DialogTitle component="div" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Messages</Typography>
          <IconButton onClick={() => setOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ display: 'flex', height: '100%', p: 0 }}>
          {/* Conversations List */}
          <Box sx={{ width: '30%', borderRight: 1, borderColor: 'divider', overflow: 'auto' }}>
            <Typography variant="subtitle1" sx={{ p: 2, bgcolor: 'grey.100' }}>
              Conversations
            </Typography>
            <List sx={{ pt: 0 }}>
              {conversations.length > 0 ? (
                conversations.filter(conversation => conversation?.user?._id).map((conversation) => {
                  try {
                    return (
                      <ListItem
                        key={conversation.user._id}
                        button
                        selected={selectedConversation?.user?._id === conversation.user._id}
                        onClick={() => handleSelectConversation(conversation)}
                        sx={{ px: 2 }}
                      >
                        <ListItemAvatar>
                          <Badge
                            badgeContent={conversation.unreadCount || 0}
                            color="error"
                            invisible={(conversation.unreadCount || 0) === 0}
                          >
                            <Avatar>
                              {conversation.user?.username ? conversation.user.username.charAt(0).toUpperCase() : '?'}
                            </Avatar>
                          </Badge>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {conversation.lastMessage ? (
                                  <Box
                                    sx={{
                                      width: 8,
                                      height: 8,
                                      borderRadius: '50%',
                                      bgcolor: conversation.lastMessage.sender._id === (user._id || user.id) ? 'green' : 'blue',
                                    }}
                                    title={`Last message from: ${conversation.lastMessage.sender._id === (user._id || user.id) ? 'You' : 'Them'} (${conversation.lastMessage.sender._id})`}
                                  />
                                ) : (
                                  <Box
                                    sx={{
                                      width: 8,
                                      height: 8,
                                      borderRadius: '50%',
                                      bgcolor: 'grey',
                                    }}
                                    title={`No messages yet - User: ${conversation.user._id}, Current: ${user._id || user.id}`}
                                  />
                                )}
                                <Typography variant="subtitle2" component="span">
                                  {getDisplayName(conversation.user)}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="caption" color="text.secondary" component="span">
                                  {conversation.lastMessage ? formatTime(conversation.lastMessage.timestamp) : ''}
                                </Typography>
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteConversation(conversation);
                                  }}
                                  sx={{
                                    opacity: 0.6,
                                    '&:hover': { opacity: 1, color: 'error.main' }
                                  }}
                                  title={`Delete conversation with ${getDisplayName(conversation.user)}`}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            </Box>
                          }
                          secondary={
                            <Typography variant="body2" color="text.secondary" noWrap component="span">
                              {conversation.lastMessage ? conversation.lastMessage.content : 'Start a conversation'}
                            </Typography>
                          }
                        />
                      </ListItem>
                    );
                  } catch (error) {
                    console.error('Error rendering conversation:', error, conversation);
                    return null;
                  }
                }).filter(Boolean)
              ) : (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <MessageIcon sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    No conversations yet
                  </Typography>
                </Box>
              )}
            </List>
          </Box>

          {/* Messages Area */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {selectedConversation ? (
              <>
                {/* Header */}
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
                  <Typography variant="h6">
                    {getDisplayName(selectedConversation.user)}
                  </Typography>
                  <Chip
                    label={selectedConversation.user.role}
                    size="small"
                    color={selectedConversation.user.role === 'student' ? 'primary' : selectedConversation.user.role === 'instructor' ? 'info' : 'secondary'}
                  />
                </Box>

                {/* Messages */}
                <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                  {loading ? (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                      Loading messages...
                    </Typography>
                  ) : messages.length > 0 ? (
                    messages.map((message) => (
                      <Box
                        key={message._id}
                        sx={{
                          display: 'flex',
                          justifyContent: message.sender._id === user.id ? 'flex-end' : 'flex-start',
                          mb: 2
                        }}
                      >
                        <Box
                          sx={{
                            maxWidth: '70%',
                            p: 1.5,
                            borderRadius: 2,
                            bgcolor: message.sender._id === user.id ? 'primary.main' : 'grey.100',
                            color: message.sender._id === user.id ? 'white' : 'text.primary'
                          }}
                        >
                          <Typography variant="body2">
                            {message.content}
                          </Typography>
                          <Typography variant="caption" sx={{ opacity: 0.7, mt: 0.5, display: 'block' }}>
                            {formatTime(message.timestamp)}
                          </Typography>
                        </Box>
                      </Box>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                      No messages yet. Start the conversation!
                    </Typography>
                  )}
                  <div ref={messagesEndRef} />
                </Box>

                {/* Message Input */}
                <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      fullWidth
                      multiline
                      maxRows={3}
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      size="small"
                    />
                    <Button
                      variant="contained"
                      endIcon={<SendIcon />}
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                    >
                      Send
                    </Button>
                  </Box>
                </Box>
              </>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Box sx={{ textAlign: 'center' }}>
                  <ChatIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    Select a conversation
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Choose someone from the list to start messaging
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Messaging;
