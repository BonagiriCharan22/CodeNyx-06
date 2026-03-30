//server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const authRoutes = require('./src/routes/auth');
const ideaRoutes = require('./src/routes/idea');
const chatRoutes = require('./src/routes/chat');
const pitchRoutes = require('./src/routes/pitch');
const simulateRoutes = require('./src/routes/simulate');
const evaluateRoutes = require('./src/routes/evaluate');
const collaboratorRoutes = require('./src/routes/collaborators');
const sessionRoutes = require('./src/routes/session');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/ideas', ideaRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/pitch', pitchRoutes);
app.use('/api/simulate', simulateRoutes);
app.use('/api/evaluate', evaluateRoutes);
app.use('/api/collaborators', collaboratorRoutes);
app.use('/api/session', sessionRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.listen(PORT, () => {
  console.log(`\n🚀 Decision Platform API running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log('\nMake sure to run: node src/db-setup.js first to create database tables\n');
});