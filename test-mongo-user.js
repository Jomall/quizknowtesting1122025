const mongoose = require('mongoose');

async function testConnection() {
  try {
    console.log('Testing MongoDB connection with jomalljack@hotmail.com...');
    const uri = 'mongodb+srv://jomalljack@hotmail.com:Jaedon532@quizknow-cluster.9iwzfgz.mongodb.net/quizknow';
    console.log('URI:', uri.replace(/:([^:@]{4})[^:@]*@/, ':***@'));

    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
    });

    console.log('✅ Connection successful with jomalljack@hotmail.com');

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));

    const User = require('./models/User');
    const userCount = await User.countDocuments();
    console.log('Users count:', userCount);

  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

testConnection();
