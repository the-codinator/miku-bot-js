import winston from 'winston';
import logform from 'logform';
import tripleBeam from 'triple-beam';

const errorFormat = logform.format((info) => {
  if (info.error) return info;

  const splat = info[tripleBeam.SPLAT as any] || [];
  const error = splat.find((obj: any) => obj instanceof Error);

  if (error) {
    info.error = error;
    const errorMsg = error.stack || error.toString();
    info.message += `\n${errorMsg}`;
  }

  return info;
});

const logger = winston.createLogger({
  transports: [new winston.transports.File({ filename: 'main.log' })],

  format: winston.format.combine(
    errorFormat(),
    winston.format.timestamp(),
    winston.format.printf(({ level, message, timestamp }) => {
      return `${timestamp} - ${level.toUpperCase()} : ${message}`;
    })
  ),

  exitOnError: false,
});

export default logger;
