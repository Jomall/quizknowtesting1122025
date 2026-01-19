const mongoose = require('mongoose');
const User = require('./models/User');

async function migrateUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/quizknow');

    console.log('Connected to MongoDB');

    // Update all existing users to have the new fields
    const result = await User.updateMany(
      {}, // Update all users
      [
        {
          $set: {
            isApproved: {
              $cond: {
                if: { $eq: ['$role', 'instructor'] },
                then: { $ifNull: ['$isApproved', false] }, // Instructors default to false if not set
                else: { $ifNull: ['$isApproved', true] }   // Others default to true if not set
              }
            },
            isSuspended: { $ifNull: ['$isSuspended', false] },
            totalStudyTime: { $ifNull: ['$totalStudyTime', 0] },
            studentLimit: { $ifNull: ['$studentLimit', 25] }
          }
        }
      ]
    );

    console.log(`Updated ${result.modifiedCount} users`);

    // Show a sample of updated users
    const sampleUsers = await User.find({}).select('email role isApproved isSuspended').limit(5);
    console.log('Sample updated users:');
    sampleUsers.forEach(user => {
      console.log(`${user.email} (${user.role}): approved=${user.isApproved}, suspended=${user.isSuspended}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateUsers();
