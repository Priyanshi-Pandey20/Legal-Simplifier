const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const cleanupOldFiles = require('./utils/cleanup');
require('dotenv').config();

const app = express();

connectDB();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

app.use('/api/auth',     require('./routes/auth'));
app.use('/api/document', require('./routes/document'));
app.use('/api/history',  require('./routes/history'));

app.get('/', (req, res) => {
  res.json({ message: 'Server is running' });
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);

  cleanupOldFiles();
  setInterval(cleanupOldFiles,24 * 60 *60 *1000);
});