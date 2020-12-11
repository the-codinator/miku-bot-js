import discord from 'discord.js';
import { fixTag, getEventOwnerTag, isInvalidUserTag, isMiku, now } from './miku-utils';
import db from './miku-db';
import { mikuPrefix } from './miku-config';
import logger from './logger';

const commands: Record<string, (msg: discord.Message, args: string[]) => Promise<void>> = {
  health,
  hello,
  bye,
  report,
  reports,
  unreport,
  reported,
  reporter,
  reportee,
  request,
  requests,
  approve,
  reject,
  stats,
};
export default commands;

async function health(msg: discord.Message, args: string[]) {
  await db.init();
  await msg.channel.send('OK');
}

async function hello(msg: discord.Message, args: string[]) {
  if (!args || args.length === 0) {
    await msg.channel.send(`Konnichiwa ${getEventOwnerTag(msg)}!`);
  }
}

async function bye(msg: discord.Message, args: string[]) {
  if (!args || args.length === 0) {
    await msg.channel.send(`kthxbi ${getEventOwnerTag(msg)}!`);
  }
}

async function request(msg: discord.Message, args: string[]) {
  if (!args || args.length !== 1) {
    await msg.channel.send(`Invalid Syntax! Baaaka! Usage: ${mikuPrefix} request @user`);
    return;
  }
  const requestor = getEventOwnerTag(msg);
  const requestee = fixTag(args[0]);
  if (isInvalidUserTag(requestee)) {
    await msg.channel.send(`Are wa dare? Usage: ${mikuPrefix} request @user`);
    return;
  }
  if (isMiku(requestee)) {
    await msg.channel.send("Miku would luv to, but Miku doesn't report people >_<");
    return;
  }
  logger.info(`command:request: ${requestor} ${requestee}`);
  if (await withRetry(() => db.request(requestor, requestee, now()))) {
    await msg.channel.send(`${requestee}, ${requestor} is requesting you to unreport :)`);
  } else {
    await msg.channel.send(`${requestee} currently has no outstanding reports against ${requestor}`);
  }
}

async function requests(msg: discord.Message, args: string[]) {
  if (args && args.length) {
    await msg.channel.send(`Invalid Syntax! Baaaka! Usage: ${mikuPrefix} requests`);
    return;
  }
  const user = getEventOwnerTag(msg);
  const requestsFromMe = await withRetry(() => db.getRequestsFrom(user));
  const requestsToMe = await withRetry(() => db.getRequestsTo(user));
  logger.info(`command:requests: ${user}`);
  if (requestsFromMe.length && requestsToMe.length) {
    await msg.channel.send(
      `${user} has requested unreports from: ${requestsFromMe} \nAnd the following have requested unreports from ${user}: ${requestsToMe}`
    );
  } else if (requestsToMe.length) {
    await msg.channel.send(`The following have requested unreports from ${user}: ${requestsToMe}`);
  } else if (requestsFromMe.length) {
    await msg.channel.send(`${user} has requested unreports from: ${requestsFromMe}`);
  } else {
    await msg.channel.send(`No requests for ${user} :)`);
  }
}

async function report(msg: discord.Message, args: string[]) {
  if (!args || (args.length != 1 && (args.length < 3 || args[1] != 'for'))) {
    await msg.channel.send(`Invalid Syntax! Baaaka! Usage: ${mikuPrefix} report @user [ for <reason> ]`);
    return;
  }
  const reporter = getEventOwnerTag(msg);
  const reportee = fixTag(args[0]);
  if (isInvalidUserTag(reportee)) {
    await msg.channel.send(`Are wa dare? Usage: ${mikuPrefix} report @user [ for <reason> ]`);
  } else if (isMiku(reportee)) await msg.channel.send('Yowai ningen... Watashi wa kamida!!');
  else if (reporter === reportee)
    await msg.channel.send("I know you're a fool, but don't prove it by reporting yourself >_<");
  else {
    logger.info(`command:report: ${reporter} ${reportee}`);
    await withRetry(() => db.report(reporter, reportee, now()));
    await msg.channel.send(`${reporter} just reported ${reportee} ${args.slice(1).join(' ')}`);
  }
}

async function unreport(msg: discord.Message, args: string[]) {
  if (!args || args.length !== 1) {
    await msg.channel.send(`Invalid Syntax! Baaaka! Usage: ${mikuPrefix} unreport @user`);
    return;
  }
  const reporter = getEventOwnerTag(msg);
  const reportee = fixTag(args[0]);
  if (isInvalidUserTag(reportee)) {
    await msg.channel.send(`Are wa dare? Usage: ${mikuPrefix} unreport @user`);
    return;
  }
  if (isMiku(reportee)) {
    await msg.channel.send('Arigato :) but fyi, you can never report me...');
    return;
  }
  if (reporter === reportee) {
    await msg.channel.send('...? Anta honki ka?');
    return;
  }
  logger.info(`command:unreport: ${reporter} ${reportee}`);
  if (await withRetry(() => db.unreport(reporter, reportee))) {
    await withRetry(() => db.deleteRequest(reportee, reporter));
    await msg.channel.send(`${reporter} did a good deed and unreported ${reportee}`);
  } else {
    await msg.channel.send(`Sugoi! ${reporter} doesn't have any reports for ${reportee}`);
  }
}

async function reported(msg: discord.Message, args: string[]) {
  if (!args || (args.length != 1 && args.length != 2)) {
    await msg.channel.send(`Anta baka desu ka? Usage: ${mikuPrefix} reported @user_reportee [ @user_reporter=self ]`);
    return;
  }
  const reporter = args.length === 2 ? fixTag(args[1]) : getEventOwnerTag(msg);
  const reportee = fixTag(args[0]);
  if (isInvalidUserTag(reporter) || isInvalidUserTag(reportee)) {
    await msg.channel.send(`Are wa dare? Usage: ${mikuPrefix} reported @reportee [ @reporter=self ]`);
    return;
  }
  if (isMiku(reportee)) {
    await msg.channel.send('Such cute kidz... Kawaiii');
    return;
  }
  if (reporter === reportee) {
    await msg.channel.send('Try reporting yourself! Nani? Omae wa mou shindeiru!!');
    return;
  }
  logger.info(`command:reported: ${reporter} ${reportee}`);
  const { count, tsString } = await withRetry(() => db.getReport(reporter, reportee));
  await msg.channel.send(`${reporter} reported ${reportee} ${count} times... ${tsString}`);
}

async function reporter(msg: discord.Message, args: string[]) {
  if (!args || args.length > 1) {
    await msg.channel.send(`Anata wa hontoni bakada! Usage: ${mikuPrefix} reporter [ @reporter=self ]`);
    return;
  }
  const user = args.length === 1 ? fixTag(args[0]) : getEventOwnerTag(msg);
  if (isInvalidUserTag(user)) {
    await msg.channel.send(`Are wa dare? Usage: ${mikuPrefix} reporter [ @reporter=self ]`);
    return;
  }
  if (isMiku(user)) {
    await msg.channel.send(`Miku is a good girl nyah! She doesn't report people nyaa..`);
    return;
  }
  logger.info(`command:reporter: ${user}`);
  const response = await withRetry(() => db.getReportVerbose('reporter', user));
  if (response) {
    await msg.channel.send(`${user} reported all these bad people: ${response}`);
  } else {
    await msg.channel.send(`${user} hasn't reported anyone recently`);
  }
}

async function reportee(msg: discord.Message, args: string[]) {
  if (!args || args.length > 1) {
    await msg.channel.send(`Anata wa hontoni bakada! Usage: ${mikuPrefix} reportee [ @reportee=self ]`);
    return;
  }
  const user = args.length === 1 ? fixTag(args[0]) : getEventOwnerTag(msg);
  if (isInvalidUserTag(user)) {
    await msg.channel.send(`Are wa dare? Usage: ${mikuPrefix} reportee [ @reportee=self ]`);
    return;
  }
  if (isMiku(user)) {
    await msg.channel.send('Miku is a good girl nyah! Noone wants to report her nyaa..');
    return;
  }

  logger.info(`command:reportee: ${user}`);
  const response = await withRetry(() => db.getReportVerbose('reportee', user));
  if (response) {
    await msg.channel.send(`${user} was reported by all these nice people: ${response}`);
  } else {
    await msg.channel.send(`${user} hasn't been reported by anyone recently`);
  }
}

async function reports(msg: discord.Message, args: string[]) {
  if (!args || args.length > 1) {
    await msg.channel.send(`Anata wa hontoni bakada! Usage: ${mikuPrefix} reportee [ @reportee=self ]`);
    return;
  }
  const user = args.length === 1 ? fixTag(args[0]) : getEventOwnerTag(msg);
  if (isInvalidUserTag(user)) {
    await msg.channel.send(`Are wa dare? Usage: ${mikuPrefix} reportee [ @reportee=self ]`);
    return;
  }
  if (isMiku(user)) {
    await msg.channel.send('Miku is a good girl nyah! Noone wants to report her nyaa..');
    return;
  }
  logger.info(`command:reports: ${user}`);
  const res = await withRetry(() => db.getReportVerbose('reporter', user));
  let response;
  if (res) {
    response = `${user} reported all these bad people: ${res}\n`;
  } else {
    response = `${user} hasn't reported anyone recently\n`;
  }
  const res2 = await withRetry(() => db.getReportVerbose('reportee', user));
  if (res2) {
    response += `${user} was reported by all these nice people: ${res2}`;
  } else {
    response += `${user} hasn't been reported by anyone recently`;
  }
  await msg.channel.send(response);
}

async function stats(msg: discord.Message, args: string[]) {
  if (!args || args.length > 1) {
    await msg.channel.send(`Anata wa hontoni bakada! Usage: ${mikuPrefix} stats [ @user=self ]`);
    return;
  }
  const user = args.length === 1 ? fixTag(args[0]) : getEventOwnerTag(msg);
  if (isInvalidUserTag(user)) {
    await msg.channel.send(`Are wa dare? Usage: ${mikuPrefix} stats [ @user=self ]`);
    return;
  }
  logger.info(`command:stats: ${user}`);
  const { gotReported, reportedOthers } = await withRetry(() => db.getReportAggregated(user));
  await msg.channel.send(`${user} got reported ${gotReported} times and reported others ${reportedOthers} times :D`);
}

async function approve(msg: discord.Message, args: string[]) {
  if (!args || args.length !== 1) {
    await msg.channel.send(`Invalid Syntax! Baaaka! Usage: ${mikuPrefix} approve @requestor`);
    return;
  }
  const requestor = fixTag(args[0]);
  const requestee = getEventOwnerTag(msg);
  if (isInvalidUserTag(requestor)) {
    await msg.channel.send(`Are wa dare? Usage: ${mikuPrefix} approve @requestor`);
    return;
  }
  if (isMiku(requestor)) {
    await msg.channel.send("Miku doesn't report people, but Miku might change her mind if you keep this up!!");
    return;
  }
  logger.info(`command:approve: ${requestor} ${requestee}`);
  if (await withRetry(() => db.unreport(requestee, requestor))) {
    await msg.channel.send(`${requestor}, ${requestee} has approved your unreport request`);
  } else {
    await msg.channel.send(`${requestee}, ${requestor} has not requested any unreport`);
  }
}

async function reject(msg: discord.Message, args: string[]) {
  if (!args || args.length !== 1) {
    await msg.channel.send(`Invalid Syntax! Baaaka! Usage: ${mikuPrefix} reject @requestor`);
    return;
  }
  const requestor = fixTag(args[0]);
  const requestee = getEventOwnerTag(msg);
  if (isInvalidUserTag(requestor)) {
    await msg.channel.send(`Are wa dare? Usage: ${mikuPrefix} reject @requestor`);
    return;
  }
  if (isMiku(requestor)) {
    await msg.channel.send("Miku doesn't report people, but Miku might change her mind if you keep this up!!");
    return;
  }
  logger.info(`command:reject: ${requestor} ${requestee}`);
  if (await withRetry(() => db.deleteRequest(requestor, requestee))) {
    await msg.channel.send(`${requestor}, ${requestee} has rejected your unreport request`);
  } else {
    await msg.channel.send(`${requestee}, ${requestor} has not requested any unreport`);
  }
}

async function withRetry<T>(func: () => Promise<T>) {
  try {
    return await func();
  } catch (e) {
    // Retry once
    logger.warn('Command failed once, retrying...', e);
    await db.init();
    return func();
  }
}
