const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const config = require('./config.json');
require('dotenv').config();
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 5300;
const uri = process.env.MONGODB_URI;
const mongoUri = config.mongoUri;
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

// Middleware setup
app.use(cors());
app.use(express.json());

// JWT verification middleware
function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    console.log("Missing Authorization header");
    return res.status(401).json({ error: "Missing Authorization header" });
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    console.log("Bad Authorization header format:", authHeader);
    return res.status(401).json({ error: "Invalid Authorization header" });
  }

  const token = parts[1];

  if (!JWT_SECRET_KEY) {
    console.error("JWT_SECRET_KEY is not set in environment for activity tracking service");
  }

  jwt.verify(token, JWT_SECRET_KEY, (err, user) => {
    if (err) {
      console.log("JWT verify error:", err.message);
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
}

// MongoDB connection
mongoose
  .connect(mongoUri, { useNewUrlParser: true })
  .then(() => console.log("MongoDB database connection established successfully"))
  .catch((error) => console.error("MongoDB connection error:", error));

const connection = mongoose.connection;

// Event listener for MongoDB connection errors
connection.on('error', (error) => {
  console.error("MongoDB connection error:", error);
});

// Public health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Routes
const exercisesRouter = require('./routes/exercises');
app.use('/exercises', authenticateJWT, exercisesRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});

module.exports = app;  