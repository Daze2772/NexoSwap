import rateLimit from 'express-rate-limit';

// Basic IP and user-based rate limiter. Limits to 100 requests per 15 minutes.
// This helps protect against brute force and denial‑of‑service attacks.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,
});

export default apiLimiter;