const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

async function testConnection() {
  try {
    console.log('Testing MongoDB connection...');
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://Jomall:Jaedon532@quizknow-cluster.9iwzfgz.mongodb.net/quizknow';
    console.log('URI:', mongoUri.replace(/:([^:@]{4})[^:@]*@/, ':***@').replace(/\/\/([^:]+):/, '//***:'));

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
    });

    console.log('✅ MongoDB connection successful');

    // List collections
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));

    // Count users
    const User = require('./models/User');
    const userCount = await User.countDocuments();
    console.log('Users count:', userCount);

    // Get test users
    const testUsers = await User.find({}, 'email role').limit(5);
    console.log('Test users found:', testUsers.map(u => ({ email: u.email, role: u.role })));

    console.log('✅ Connection test completed successfully');

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

testConnection();
