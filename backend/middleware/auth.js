const jwt = require("jsonwebtoken");

function auth(req, res, next) {
  const token = req.headers["authorization"];

  if (!token) {
    return res.status(401).send("Access denied. No token provided.");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // attach user info to request
    next();
  } catch (err) {
    res.status(400).send("Invalid token.");
  }
}

module.exports = auth;
