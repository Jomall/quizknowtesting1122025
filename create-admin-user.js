const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function createAdminUser() {
  try {
    // Connect to the same MongoDB Memory Server used by server-test.js
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongoServer = await MongoMemoryServer.create({
      instance: {
        dbName: 'quizknow-app6mongoDB',
        port: 27017,
      },
      binary: {
        version: '6.0.5',
        downloadDir: './.mongodb-binaries',
        platform: 'win32',
        arch: 'x64',
        skipMD5: true,
      },
    });
    const mongoUri = mongoServer.getUri();
    console.log('Connecting to MongoDB Memory Server for admin creation...');
    await mongoose.connect(mongoUri);

    const adminUser = new User({
      username: 'admin',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin',
      isApproved: true
    });

    await adminUser.save();
    console.log('Admin user created successfully!');
    console.log('Email: admin@example.com');
    console.log('Password: admin123');

    mongoose.connection.close();
  } catch (error) {
    console.error('Error creating admin user:', error.message);
    mongoose.connection.close();
  }
}

createAdminUser();
