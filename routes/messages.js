const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const Connection = require('../models/Connection');
const { auth, authorize, checkSuspended } = require('../middleware/auth');

// Helper function to check if users are connected
const checkConnection = async (userId1, userId2) => {
  const connection = await Connection.findOne({
    $or: [
      { sender: userId1, receiver: userId2, status: 'accepted' },
      { sender: userId2, receiver: userId1, status: 'accepted' }
    ]
  });
  return !!connection;
};

// Send a message
router.post('/', auth, checkSuspended, async (req, res) => {
  try {
    const { receiverId, content } = req.body;

    if (!receiverId || !content) {
      return res.status(400).json({ message: 'Receiver ID and content are required' });
    }

    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found' });
    }

    // Check connection (skip for admins and students for testing)
    if (req.user.role !== 'admin' && req.user.role !== 'student') {
      const isConnected = await checkConnection(req.user.id, receiverId);
      if (!isConnected) {
        return res.status(403).json({ message: 'You can only message connected users' });
      }
    }

    // Create message
    const message = new Message({
      sender: req.user._id,
      receiver: receiverId,
      content: content.trim()
    });

    await message.save();
    await message.populate('sender', 'username profile.firstName profile.lastName');
    await message.populate('receiver', 'username profile.firstName profile.lastName');

    // Emit real-time message via Socket.io
    const io = req.app.get('io');
    io.to(receiverId).emit('new-message', message);

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get messages between current user and another user
router.get('/conversation/:userId', auth, checkSuspended, async (req, res) => {
  try {
    const otherUserId = req.params.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Check if users are connected (skip for admins and students for testing)
    if (req.user.role !== 'admin' && req.user.role !== 'student') {
      const isConnected = await checkConnection(req.user.id, otherUserId);
      if (!isConnected) {
        return res.status(403).json({ message: 'You can only view messages with connected users' });
      }
    }

    const messages = await Message.find({
      $or: [
        { sender: req.user.id, receiver: otherUserId },
        { sender: otherUserId, receiver: req.user.id }
      ]
    })
    .populate('sender', 'username profile.firstName profile.lastName profile.avatar')
    .populate('receiver', 'username profile.firstName profile.lastName profile.avatar')
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit);

    // Mark messages as read
    await Message.updateMany(
      { sender: otherUserId, receiver: req.user.id, read: false },
      { read: true }
    );

    res.json({
      success: true,
      data: messages.reverse(), // Return in chronological order
      pagination: {
        page,
        limit,
        hasMore: messages.length === limit
      }
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get list of conversations for current user
router.get('/conversations', auth, checkSuspended, async (req, res) => {
  try {
    // For all users, show all other users (simplified approach for messaging)
    const users = await User.find({ _id: { $ne: req.user._id } }, 'username profile role')
      .sort({ 'profile.firstName': 1, 'profile.lastName': 1, username: 1 });

    const conversations = await Promise.all(users.map(async (user) => {
      // Get last message and unread count for this conversation
      const query = {
        $or: [
          { sender: req.user._id, receiver: user._id },
          { sender: user._id, receiver: req.user._id }
        ]
      };
      console.log(`Query for conversation with ${user.username}:`, JSON.stringify(query, null, 2));
      const lastMessage = await Message.findOne(query)
        .populate('sender', 'username profile.firstName profile.lastName')
        .sort({ timestamp: -1 });
      console.log(`Found lastMessage for ${user.username}:`, lastMessage);

      const unreadCount = await Message.countDocuments({
        sender: user._id,
        receiver: req.user._id,
        read: false
      });

      console.log(`Conversation with ${user.username}:`);
      console.log(`  - User ID: ${user._id}`);
      console.log(`  - Current user ID: ${req.user._id}`);
      console.log(`  - Last message:`, lastMessage);
      console.log(`  - Unread count: ${unreadCount}`);

      return {
        user: {
          _id: user._id,
          username: user.username,
          profile: user.profile,
          role: user.role
        },
        lastMessage,
        unreadCount
      };
    }));

    res.json({
      success: true,
      data: conversations
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark messages as read
router.put('/read/:userId', auth, checkSuspended, async (req, res) => {
  try {
    const otherUserId = req.params.userId;

    await Message.updateMany(
      { sender: otherUserId, receiver: req.user.id, read: false },
      { read: true }
    );

    res.json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a message (soft delete by marking as deleted)
router.delete('/:messageId', auth, checkSuspended, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Only sender can delete their own messages
    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own messages' });
    }

    await Message.findByIdAndDelete(req.params.messageId);

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete entire conversation with another user
router.delete('/conversation/:userId', auth, checkSuspended, async (req, res) => {
  try {
    const otherUserId = req.params.userId;

    // Delete all messages between current user and the other user
    const result = await Message.deleteMany({
      $or: [
        { sender: req.user.id, receiver: otherUserId },
        { sender: otherUserId, receiver: req.user.id }
      ]
    });

    res.json({
      success: true,
      message: 'Conversation deleted successfully',
      data: { deletedCount: result.deletedCount }
    });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get total unread message count for current user
router.get('/unread-count', auth, checkSuspended, async (req, res) => {
  try {
    const unreadCount = await Message.countDocuments({
      receiver: req.user.id,
      read: false
    });

    res.json({
      success: true,
      data: { unreadCount }
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Get all messages (moderation)
router.get('/admin/all', auth, authorize('admin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const messages = await Message.find()
      .populate('sender', 'username profile.firstName profile.lastName')
      .populate('receiver', 'username profile.firstName profile.lastName')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Message.countDocuments();

    res.json({
      success: true,
      data: messages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching all messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
