const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

module.exports = async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || typeof authHeader !== "string") {
    req.user = null;
    return next();
  }
  try {
    if (!authHeader.startsWith("Bearer ")) {
      req.user = null;
      return next();
    }
    const token = authHeader.split(" ")[1];
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch (err) {
    req.user = null;
    return next();
  }
};
