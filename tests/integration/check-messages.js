const mongoose = require('mongoose');
require('./models/Message');
require('./models/User');
const Message = mongoose.model('Message');
const User = mongoose.model('User');

mongoose.connect('mongodb://localhost:27017/quizknow', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  const user = await User.findOne({ email: 'jaedon@gmail.com' });
  if (user) {
    console.log('User found:', user._id, user.email);

    // Check all messages involving this user
    const allMessages = await Message.find({
      $or: [
        { sender: user._id },
        { receiver: user._id }
      ]
    }).populate('sender', 'username email').populate('receiver', 'username email').sort({ timestamp: -1 });

    console.log('All messages for jaedon@gmail.com:');
    allMessages.forEach((m, i) => {
      console.log(`  ${i+1}. ${m.sender.email} -> ${m.receiver.email}: '${m.content}' (read: ${m.read})`);
    });

    // Check unread messages
    const unreadMessages = await Message.find({
      receiver: user._id,
      read: false
    }).populate('sender', 'username email');

    console.log('Unread messages for jaedon@gmail.com:');
    unreadMessages.forEach((m, i) => {
      console.log(`  ${i+1}. From ${m.sender.email}: '${m.content}'`);
    });

  } else {
    console.log('User not found');
  }
  mongoose.disconnect();
}).catch(err => console.error('Error:', err));
