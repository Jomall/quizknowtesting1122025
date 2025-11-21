const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://quizknow-user:Jaedon@quizknow-cluster.9iwzfgz.mongodb.net/quizknow';
    console.log('Testing MongoDB connection...');
    console.log('URI:', mongoUri.replace(/:[^:]+@/, ':***@')); // Hide password

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    });

    console.log('✅ MongoDB connection successful');

    const db = mongoose.connection.db;
    const collections = await db.collections();
    console.log('Available collections:', collections.map(c => c.collectionName));

    // Test users collection
    const usersCount = await db.collection('users').countDocuments();
    console.log('Users count:', usersCount);

    // Check if test users exist
    const testUsers = await db.collection('users').find({
      email: { $in: ['admin@quizknow.com', 'instructor@quizknow.com', 'student@quizknow.com'] }
    }).toArray();

    console.log('Test users found:', testUsers.map(u => ({ email: u.email, role: u.role })));

    await mongoose.disconnect();
    console.log('✅ Connection test completed successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

testConnection();
