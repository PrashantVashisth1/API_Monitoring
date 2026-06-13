import winston from "winston";
import config from "./index.js";
import fs from "fs";

/**
 * winston logger configuration
 * Console transport is always active (required for Railway/Vercel/cloud logs).
 * File transports are added only if a writable `logs/` directory exists (local dev).
 */
const transports = [
  // Always log to console — this is how Railway / cloud platforms capture logs
  new winston.transports.Console({
    format: winston.format.combine(
      config.node_env !== 'production' ? winston.format.colorize() : winston.format.uncolorize(),
      winston.format.simple()
    )
  }),
];

// Add file transports only in local dev (where logs/ directory can be created)
if (config.node_env !== 'production') {
  try {
    if (!fs.existsSync('logs')) fs.mkdirSync('logs', { recursive: true });
    transports.push(new winston.transports.File({ filename: 'logs/error.log', level: 'error' }));
    transports.push(new winston.transports.File({ filename: 'logs/combined.log' }));
  } catch (_) {
    // silently skip file logging if dir can't be created
  }
}

const logger = winston.createLogger({
  level: config.node_env === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'api-monitoring' },
  transports,
});

export default logger;