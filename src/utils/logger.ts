import winston from 'winston';
import morgan from 'morgan';
import { env } from '../config/env.js';

const { combine, timestamp, errors, json, colorize, simple } = winston.format;

const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    timestamp(),
    errors({ stack: true }),
    json()
  ),
  defaultMeta: { service: 'sa-university-portal' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: combine(
      colorize(),
      simple()
    ),
  }));
}

export const morganStream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

export const morganMiddleware = morgan(
  ':method :url :status :res[content-length] - :response-time ms',
  { stream: morganStream }
);

export default logger;
