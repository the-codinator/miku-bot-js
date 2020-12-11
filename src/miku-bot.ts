import discord from 'discord.js';
import logger from './logger';
import commands from './miku-commands';
import { mikuPrefix, mikuTag } from './miku-config';

class MikuBot {
  readonly bot = new discord.Client();

  async start() {
    await this.bot.login(process.env.DISCORD_TOKEN);

    this.bot.on('ready', async () => {
      logger.info(`event:ready: bot online name=${this.bot.user?.username} id=${this.bot.user?.id}`);
      await this.bot.user?.setPresence({
        activity: {
          name: "Let's Report People!",
        },
      });
    });

    this.bot.on('message', async (msg) => {
      const args = msg.content.split(/\s+/);
      const prefix = args.shift();
      const cmd = args.shift();

      if ((prefix === mikuPrefix || prefix === mikuTag) && cmd && cmd in commands) {
        try {
          logger.info(`command:${cmd} owner=${msg.author.username}`);
          await commands[cmd](msg, args);
        } catch (e) {
          logger.error(`command:${cmd}: failed`, e);
        }
      }
    });
  }
}

export default new MikuBot();
