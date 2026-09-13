// Entry point - Express server
// API routes
// app.use('/api', routes);

// // Test route
// app.get('/api/test', (req, res) => {
//   res.json({
//     success: true,
//     message: "Backend is connected!"
//   });
// });

const express = require('express');
const http = require('http');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const { sequelize } = require('./models');
const routes = require('./routes');

const app = express();
const server = http.createServer(app);

// CORS setup
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map(o => o.trim());
    // Vite selects the next available port when 5173 is already in use.
    // Accept loopback origins during development while keeping production
    // restricted to the explicitly configured CLIENT_URL values.
    const isLocalDevelopmentOrigin = process.env.NODE_ENV !== 'production' &&
      /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin || '');

    if (!origin || allowedOrigins.includes(origin) || isLocalDevelopmentOrigin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// API routes
app.use('/api', routes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('GLOBAL ERROR:', err);

  const statusCode =
    Number.isInteger(err.statusCode) && err.statusCode >= 400
      ? err.statusCode
      : Number.isInteger(err.status) && err.status >= 400
        ? err.status
        : 500;

  res.status(statusCode).json({
    success: false,
    error: err.message || 'Server Error',
  });
});
const PORT = process.env.PORT || 5000;

// Test database connection and start server
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // In development, you might want to run migrations automatically here
    // For production, migrations should be run explicitly

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = { app, server };
