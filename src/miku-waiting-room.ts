import discord from 'discord.js';
import logger from './logger';
import { dotaChannel, waitingRoomChannel, waitingRoomSize } from './miku-config';

async function waitingRoom(before: discord.VoiceState, after: discord.VoiceState): Promise<boolean> {
  if (!after?.channel) {
    // Left voice channel
    return false;
  }
  const from = after.channel;
  if (from.id === before?.channel?.id) {
    // Event is not for channel change
    return false;
  }
  if (from.isText() || !from.name.includes(waitingRoomChannel)) {
    // Wrong channel
    return false;
  }
  const members = from.members;
  const humans = members.filter((member) => !member.user.bot);
  if (humans.size < waitingRoomSize) {
    // Not yet full
    return false;
  }
  const to = from.guild.channels.cache.find((ch) => ch.name.startsWith(dotaChannel));
  if (!to || to.isText()) {
    // Channels were not what we expected
    logger.warn('Could not find target room', dotaChannel);
    return false;
  }
  // Move members
  logger.info(`Waiting Room ready, moving everyone to ${to.name}!`);
  await Promise.all(members.map((member) => member.voice.setChannel(to)));
  return true;
}

export default waitingRoom;
