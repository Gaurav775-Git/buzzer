const adminAuth = (req, res, next) => {
  const authHeader = req.headers.authorization || '';

  if (authHeader !== 'Bearer admin123') {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  return next();
};

module.exports = adminAuth;
