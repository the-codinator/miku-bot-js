import discord from 'discord.js';
import logger from './logger';
import { dotaChannel, waitingRoomChannel, waitingRoomSize } from './miku-config';

async function waitingRoom(before: discord.VoiceState, after: discord.VoiceState) {
  if (!after?.channel) {
    // Left voice channel
    return;
  }
  const from = after.channel;
  if (from.id === before?.channel?.id) {
    // Event is not for channel change
    return;
  }
  if (from.name !== waitingRoomChannel) {
    return;
  }
  const members = from.members;
  const humans = members.filter((member) => !member.user.bot);
  if (humans.size >= waitingRoomSize) {
    logger.info('Waiting Room ready, moving everyone!');
    const to = from.guild.channels.cache.find(ch => ch.name === dotaChannel);
    if (!to || to.isText()) {
      logger.warn('Could not find target room', dotaChannel);
      return;
    }
    // Move members;
    await Promise.all(members.map(member => member.voice.setChannel(to)))
    return true;
  }
}

export default waitingRoom;
