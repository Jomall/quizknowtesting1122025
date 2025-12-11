const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function checkUsers() {
  try {
    // Connect to production MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://Jomall:IlhrnmowW6YDcABG@quizknow-cluster.9iwzfgz.mongodb.net/';
    console.log('Connecting to production MongoDB...');
    await mongoose.connect(mongoUri);

    // Check users
    const users = await User.find({}, 'username email role isApproved isSuspended').select('-password');
    console.log('Users in database:');
    users.forEach(user => {
      console.log(`- ${user.username}: ${user.email} (${user.role}) - Approved: ${user.isApproved}, Suspended: ${user.isSuspended}`);
    });

    mongoose.connection.close();
  } catch (error) {
    console.error('Error checking users:', error.message);
    mongoose.connection.close();
  }
}

checkUsers();
