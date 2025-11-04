const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

async function migrateData() {
  try {
    // Connect to local MongoDB
    console.log('Connecting to local MongoDB...');
    const localConn = await mongoose.createConnection('mongodb://localhost:27017/quizknow', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to local MongoDB');

    // Connect to Atlas MongoDB
    const atlasUri = process.env.MONGODB_URI;
    console.log('Connecting to Atlas MongoDB...');
    const atlasConn = await mongoose.createConnection(atlasUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to Atlas MongoDB');

    // Get collections
    const localUsers = localConn.collection('users');
    const localQuizzes = localConn.collection('quizzes');
    const localSubmissions = localConn.collection('quizsubmissions');
    const localContents = localConn.collection('contents');
    const localContentViews = localConn.collection('contentviews');
    const localConnections = localConn.collection('connections');

    const atlasUsers = atlasConn.collection('users');
    const atlasQuizzes = atlasConn.collection('quizzes');
    const atlasSubmissions = atlasConn.collection('quizsubmissions');
    const atlasContents = atlasConn.collection('contents');
    const atlasContentViews = atlasConn.collection('contentviews');
    const atlasConnections = atlasConn.collection('connections');

    // Clear Atlas collections first
    console.log('Clearing Atlas collections...');
    await atlasUsers.deleteMany({});
    await atlasQuizzes.deleteMany({});
    await atlasSubmissions.deleteMany({});
    await atlasContents.deleteMany({});
    await atlasContentViews.deleteMany({});
    await atlasConnections.deleteMany({});

    // Migrate users
    console.log('Migrating users...');
    const users = await localUsers.find({}).toArray();
    if (users.length > 0) {
      await atlasUsers.insertMany(users);
      console.log(`Migrated ${users.length} users`);
    }

    // Migrate quizzes
    console.log('Migrating quizzes...');
    const quizzes = await localQuizzes.find({}).toArray();
    if (quizzes.length > 0) {
      await atlasQuizzes.insertMany(quizzes);
      console.log(`Migrated ${quizzes.length} quizzes`);
    }

    // Migrate submissions
    console.log('Migrating submissions...');
    const submissions = await localSubmissions.find({}).toArray();
    if (submissions.length > 0) {
      await atlasSubmissions.insertMany(submissions);
      console.log(`Migrated ${submissions.length} submissions`);
    }

    // Migrate contents
    console.log('Migrating contents...');
    const contents = await localContents.find({}).toArray();
    if (contents.length > 0) {
      await atlasContents.insertMany(contents);
      console.log(`Migrated ${contents.length} contents`);
    }

    // Migrate content views
    console.log('Migrating content views...');
    const contentViews = await localContentViews.find({}).toArray();
    if (contentViews.length > 0) {
      await atlasContentViews.insertMany(contentViews);
      console.log(`Migrated ${contentViews.length} content views`);
    }

    // Migrate connections
    console.log('Migrating connections...');
    const connections = await localConnections.find({}).toArray();
    if (connections.length > 0) {
      await atlasConnections.insertMany(connections);
      console.log(`Migrated ${connections.length} connections`);
    }

    console.log('Migration completed successfully!');

    // Close connections
    await localConn.close();
    await atlasConn.close();

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateData();
