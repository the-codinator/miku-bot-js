import winston from 'winston';

const logger = winston.createLogger({
  transports: [new winston.transports.File({ filename: 'main.log' })],

  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ level, message, timestamp }) => {
      return `${timestamp} - ${level.toUpperCase()} : ${message}`;
    })
  ),

  exitOnError: false,
});

export default logger;
