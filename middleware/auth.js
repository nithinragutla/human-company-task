const jwt = require("jsonwebtoken");

// Middleware to verify JWT token and attach user data to req.user
exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer "))
    return res.status(401).json({ message: "Access denied. No token provided." });

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // attach user id and role
    next();
  } catch (err) {
    return res.status(400).json({ message: "Invalid or expired token" });
  }
};

// Middleware to allow only Admins
exports.isAdmin = (req, res, next) => {
  if (req.user.role !== "Admin")
    return res.status(403).json({ message: "Admin access required" });
  next();
};

// Middleware to allow only Members
exports.isMember = (req, res, next) => {
  if (req.user.role !== "Member")
    return res.status(403).json({ message: "Member access required" });
  next();
};
