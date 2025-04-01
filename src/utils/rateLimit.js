const rateLimit = require("express-rate-limit");

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Límite por IP
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    // Log para depuración (eliminar en producción)
    // console.log(`Rate Limit Check. req.ip: ${req.ip}, X-Forwarded-For: ${req.headers['x-forwarded-for']}, Remote Address: ${req.socket.remoteAddress}`);
    return req.ip;
  },
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json({ message: options.message });
  },
});

module.exports = apiLimiter;
