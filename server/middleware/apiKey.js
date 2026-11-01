// Protects write routes (used by the MCP servers).
// If API_KEY is NOT set in the environment, the check is skipped (handy for local dev).
const requireApiKey = (req, res, next) => {
  const expected = process.env.API_KEY;
  if (!expected) return next();
  if (req.get("x-api-key") !== expected) {
    return res.status(401).json({ message: "Invalid or missing API key" });
  }
  next();
};

export default requireApiKey;
