import { config } from 'dotenv';
config();

import logger from './logger';
import db from './miku-db';
import bot from './miku-bot';

async function main() {
  logger.info('Miku Bot starting...');
  await db.init();
  await bot.start();
}

main()
  .then(() => logger.info('Miku Bot: Ready!'))
  .catch((e) => logger.error('Miku Bot', e));
