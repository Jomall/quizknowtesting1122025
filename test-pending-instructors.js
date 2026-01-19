const mongoose = require('mongoose');
const User = require('./models/User');

async function testPendingInstructors() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/quizknow');

    console.log('Testing pending instructors query...');

    // Query for pending instructors (same as in routes/users.js)
    const pendingInstructors = await User.find({
      role: 'instructor',
      isApproved: false
    }).select('-password');

    console.log(`Found ${pendingInstructors.length} pending instructors:`);
    pendingInstructors.forEach(user => {
      console.log(`- ${user.email} (role: ${user.role}, approved: ${user.isApproved})`);
    });

    // Also check all instructors
    const allInstructors = await User.find({ role: 'instructor' }).select('email isApproved');
    console.log(`\nAll instructors (${allInstructors.length}):`);
    allInstructors.forEach(user => {
      console.log(`- ${user.email}: approved=${user.isApproved}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

testPendingInstructors();
