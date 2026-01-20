const mongoose = require('mongoose');
require('./models/Message');
require('./models/User');
const Message = mongoose.model('Message');
const User = mongoose.model('User');

mongoose.connect('mongodb://localhost:27017/quizknow', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('=== ALL USERS ===');
  const users = await User.find({}, 'username email _id');
  users.forEach(u => {
    console.log(`  ${u.username}: ${u.email} - ${u._id}`);
  });

  console.log('\n=== ALL MESSAGES ===');
  const messages = await Message.find({})
    .populate('sender', 'username email')
    .populate('receiver', 'username email')
    .sort({ timestamp: -1 });
  messages.forEach((m, i) => {
    console.log(`${i+1}. ${m.sender.username} (${m.sender._id}) -> ${m.receiver.username} (${m.receiver._id}): "${m.content}" (read: ${m.read})`);
  });

  console.log('\n=== CHECKING CONVERSATIONS FOR jaedon@gmail.com ===');
  const jaedon = await User.findOne({ email: 'jaedon@gmail.com' });
  if (jaedon) {
    console.log(`Jaedon user ID: ${jaedon._id}`);

    // Check conversations API logic
    const otherUsers = await User.find({ _id: { $ne: jaedon._id } }, 'username profile role');
    console.log(`Other users: ${otherUsers.length}`);

    for (const user of otherUsers) {
      const query = {
        $or: [
          { sender: jaedon._id, receiver: user._id },
          { sender: user._id, receiver: jaedon._id }
        ]
      };
      console.log(`\nQuery for ${user.username} (${user._id}):`);
      console.log(JSON.stringify(query, null, 2));

      const lastMessage = await Message.findOne(query)
        .populate('sender', 'username profile.firstName profile.lastName')
        .sort({ timestamp: -1 });

      const unreadCount = await Message.countDocuments({
        sender: user._id,
        receiver: jaedon._id,
        read: false
      });

      console.log(`Last message: ${lastMessage ? lastMessage.content : 'null'}`);
      console.log(`Unread count: ${unreadCount}`);
    }
  }

  mongoose.disconnect();
}).catch(err => console.error('Error:', err));
