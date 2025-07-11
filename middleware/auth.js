const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // Get token from x-auth-token header
  let token = req.header('x-auth-token');
  if (!token) {
    // Try Authorization: Bearer <token>
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  // Check if no token
  if (!token) {
    return res.status(401).json({ error: 'No token, authorization denied' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'SaiGame@ecommerce');
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token is not valid' });
  }
}; 
