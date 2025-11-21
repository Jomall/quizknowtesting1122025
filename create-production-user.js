const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function createProductionUser() {
  try {
    // Connect to production MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://quizknow-user:Jaedon@quizknow-cluster.9iwzfgz.mongodb.net/';
    console.log('Connecting to production MongoDB...');
    await mongoose.connect(mongoUri);

    // Create admin user
    const adminUser = new User({
      username: 'admin',
      email: 'admin@quizknow.com',
      password: 'admin123',
      role: 'admin',
      isApproved: true
    });

    await adminUser.save();
    console.log('Admin user created successfully in production!');
    console.log('Email: admin@quizknow.com');
    console.log('Password: admin123');

    // Create test instructor
    const instructorUser = new User({
      username: 'instructor',
      email: 'instructor@quizknow.com',
      password: 'instructor123',
      role: 'instructor',
      isApproved: true
    });

    await instructorUser.save();
    console.log('Instructor user created successfully!');
    console.log('Email: instructor@quizknow.com');
    console.log('Password: instructor123');

    // Create test student
    const studentUser = new User({
      username: 'student',
      email: 'student@quizknow.com',
      password: 'student123',
      role: 'student',
      isApproved: true
    });

    await studentUser.save();
    console.log('Student user created successfully!');
    console.log('Email: student@quizknow.com');
    console.log('Password: student123');

    mongoose.connection.close();
  } catch (error) {
    console.error('Error creating users:', error.message);
    mongoose.connection.close();
  }
}

createProductionUser();
