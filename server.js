const express = require('express');
const { MongoClient } = require('mongodb');
const { createClient } = require('redis');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://mongodb:27017';
const REDIS_HOST = process.env.REDIS_HOST || 'redis';
const REDIS_PORT = process.env.REDIS_PORT || 6379;

// MongoDB connection
let mongoClient;
let db;
let usersCollection;

// Redis connection
let redisClient;

// Initialize MongoDB connection
async function connectMongoDB() {
  try {
    mongoClient = new MongoClient(MONGODB_URI);
    await mongoClient.connect();
    db = mongoClient.db('docker-test-db');
    usersCollection = db.collection('users');
    console.log('✅ Connected to MongoDB successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
  }
}

// Initialize Redis connection
async function connectRedis() {
  try {
    redisClient = createClient({
      socket: {
        host: REDIS_HOST,
        port: REDIS_PORT
      }
    });

    redisClient.on('error', (err) => console.error('Redis Client Error', err));
    redisClient.on('connect', () => console.log('🔄 Connecting to Redis...'));
    redisClient.on('ready', () => console.log('✅ Connected to Redis successfully'));

    await redisClient.connect();
  } catch (error) {
    console.error('❌ Redis connection error:', error.message);
  }
}

// Initialize connections
async function initializeConnections() {
  await connectMongoDB();
  await connectRedis();
}

// Routes

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// MongoDB endpoint - Create a user
app.post('/api/users', async (req, res) => {
  try {
    if (!usersCollection) {
      return res.status(503).json({ error: 'MongoDB not connected' });
    }

    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const result = await usersCollection.insertOne({
      name,
      email,
      createdAt: new Date()
    });

    res.status(201).json({
      message: 'User created successfully',
      userId: result.insertedId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// MongoDB endpoint - Get all users
app.get('/api/users', async (req, res) => {
  try {
    if (!usersCollection) {
      return res.status(503).json({ error: 'MongoDB not connected' });
    }

    const users = await usersCollection.find({}).toArray();
    res.json({ count: users.length, users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Redis endpoint - Set a key-value pair
app.post('/api/cache', async (req, res) => {
  try {
    if (!redisClient || !redisClient.isOpen) {
      return res.status(503).json({ error: 'Redis not connected' });
    }

    const { key, value } = req.body;
    if (!key || !value) {
      return res.status(400).json({ error: 'Key and value are required' });
    }

    await redisClient.set(key, value);
    res.json({
      message: 'Value cached successfully',
      key,
      value
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Redis endpoint - Get a value by key
app.get('/api/cache/:key', async (req, res) => {
  try {
    if (!redisClient || !redisClient.isOpen) {
      return res.status(503).json({ error: 'Redis not connected' });
    }

    const { key } = req.params;
    const value = await redisClient.get(key);

    if (value === null) {
      return res.status(404).json({ error: 'Key not found' });
    }

    res.json({ key, value });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Redis endpoint - Get all keys
app.get('/api/cache', async (req, res) => {
  try {
    if (!redisClient || !redisClient.isOpen) {
      return res.status(503).json({ error: 'Redis not connected' });
    }

    const keys = await redisClient.keys('*');
    const values = {};

    if (keys.length > 0) {
      for (const key of keys) {
        values[key] = await redisClient.get(key);
      }
    }

    res.json({ count: keys.length, cache: values });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  await initializeConnections();
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing connections');
  if (mongoClient) await mongoClient.close();
  if (redisClient && redisClient.isOpen) await redisClient.quit();
  process.exit(0);
});

