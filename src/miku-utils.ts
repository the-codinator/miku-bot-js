import discord from 'discord.js';
import { mikuTag } from './miku-config';

const pattern = /^<@\d+>$/

export function isInvalidUserTag(s: string) {
  return !pattern.test(s);
}

export function fixId(s: string) {
  if (s?.startsWith('<@!')) {
    s.replace('!', '');
  }
  return s;
}

export function getEventOwnerTag(msg: discord.Message) {
  return `<@${msg.author.id}>`;
}

export function now() {
  return new Date().toISOString().split('.')[0].replace('T', ' ');
}

export function isMiku(s: string) {
  return s === mikuTag;
}
