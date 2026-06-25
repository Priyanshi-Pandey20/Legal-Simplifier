const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log('Auth header received:', authHeader); 

  const token = authHeader?.split(' ')[1];
  console.log('Token extracted:', token); 

  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded:', decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.log('JWT Error:', err.message); // debug
    res.status(401).json({ error: 'Invalid token' });
  }
};