require('dotenv').config();
const mongoose = require('mongoose');

console.log('Testing MongoDB Atlas connection...');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'SET' : 'NOT SET');

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/codearena';
console.log('Using URI:', mongoUri);

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  bufferCommands: false,
  maxPoolSize: 10,
  serverApi: {
    version: '1',
    strict: true,
    deprecationErrors: true,
  }
})
.then(() => {
  console.log('✅ MongoDB Atlas connection successful!');
  console.log('Database:', mongoose.connection.name);
  console.log('Host:', mongoose.connection.host);
  console.log('Port:', mongoose.connection.port);
  
  // List all collections
  mongoose.connection.db.listCollections().toArray((err, collections) => {
    if (err) {
      console.log('Error listing collections:', err.message);
    } else {
      console.log('Collections in database:');
      if (collections.length === 0) {
        console.log('  No collections found (database is empty)');
      } else {
        collections.forEach(collection => {
          console.log('  -', collection.name);
        });
      }
    }
    mongoose.connection.close();
  });
})
.catch((error) => {
  console.log('❌ MongoDB Atlas connection failed:');
  console.log('Error:', error.message);
  process.exit(1);
}); 