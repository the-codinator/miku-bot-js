import discord from 'discord.js';
import { fixId, getEventOwnerTag, isInvalidUserTag, isMiku, now } from './miku-utils';
import db from './miku-db';
import { mikuPrefix } from './miku-config';
import logger from './logger';

const commands: Record<string, (msg: discord.Message, args: string[]) => Promise<void>> = { hello, health, bye, report };
export default commands;

async function hello(msg: discord.Message, args: string[]) {
  if (!args || args.length === 0) {
    await msg.channel.send(`Konnichiwa ${getEventOwnerTag(msg)}!`);
  }
}

async function health(msg: discord.Message, args: string[]) {
  await db.init();
  await msg.channel.send('OK');
}

async function bye(msg: discord.Message, args: string[]) {
  if (!args || args.length === 0) {
    await msg.channel.send('kthxbi ' + getEventOwnerTag(msg) + '!');
  }
}

// @bot.command()
// async function request(msg: discord.Message, args: string[]):
//     if len(arg) != 1:
//         await msg.channel.send("Invalid Syntax! Baaaka! Usage: " + mikuPrefix + "request @user")
//         return
//     requestor = getEventOwnerTag(msg)
//     requestee = fixId(arg[0])
//     if isInvalidUserId(requestee):
//         await msg.channel.send("Are wa dare? Usage: " + mikuPrefix + "request @user")
//         return
//     if isMiku(requestee):
//         await msg.channel.send("Miku would luv to, but Miku doesn't report people >_<")
//         return
//     log("command:request: %s %s" % (requestor, requestee))
//     if db.request(requestor, requestee, now()):
//         await msg.channel.send(requestee + ", " + requestor + " is requesting you to unreport :)")
//     else:
//         await msg.channel.send(requestee + " currently has no outstanding reports against " + requestor)

// @bot.command()
// async function requests(msg: discord.Message, args: string[]):
//     if len(arg) != 0:
//         await msg.channel.send("Invalid Syntax! Baaaka! Usage: " + mikuPrefix + "requests")
//         return
//     user = getEventOwnerTag(msg)
//     requests_from_me = db.get_requests_from(user)
//     requests_to_me = db.get_requests_to(user)
//     log("command:requests: %s" % (user))
//     if len(requests_from_me) and len(requests_to_me):
//         await msg.channel.send(user + " has requested unreports from: " + requests_from_me + "\nAnd the following have requested unreports from " + user + ": " + requests_to_me)
//     elif not len(requests_from_me) and len(requests_to_me):
//         await msg.channel.send("The following have requested unreports from " + user + ": " + requests_to_me)
//     elif len(requests_from_me) and not len(requests_to_me):
//         await msg.channel.send(user + " has requested unreports from: " + requests_from_me)
//     else:
//         await msg.channel.send("No requests for " + user + " :)")

async function report(msg: discord.Message, args: string[]) {
  if (args && args.length != 1 && (args.length < 3 || args[1] != 'for')) {
    await msg.channel.send('Invalid Syntax! Baaaka! Usage: ' + mikuPrefix + ' report @user [ for <reason> ]');
    return;
  }
  const reporter = getEventOwnerTag(msg);
  const reportee = fixId(args[0]);
  if (isInvalidUserTag(reportee)) {
    await msg.channel.send('Are wa dare? Usage: ' + mikuPrefix + 'report @user [ for <reason> ]');
  } else if (isMiku(reportee)) await msg.channel.send('Yowai ningen... Watashi wa kamida!!');
  else if (reporter === reportee)
    await msg.channel.send("I know you're a fool, but don't prove it by reporting yourself >_<");
  else {
    logger.info(`command:report: ${reporter} ${reportee}`);
    db.report(reporter, reportee, now());
    await msg.channel.send(`${reporter} just reported ${reportee} ${args.slice(1).join(' ')}`);
  }
}

// @bot.command()
// async function unreport(msg: discord.Message, args: string[]):
//     if len(arg) != 1:
//         await msg.channel.send("Invalid Syntax! Baaaka! Usage: " + mikuPrefix + "unreport @user")
//         return
//     reporter = getEventOwnerTag(msg)
//     reportee = fixId(arg[0])
//     if isInvalidUserId(reportee):
//         await msg.channel.send("Are wa dare? Usage: " + mikuPrefix + "unreport @user")
//         return
//     if isMiku(reportee):
//         await msg.channel.send("Arigato :) but fyi, you can never report me...")
//         return
//     if reporter == reportee:
//         await msg.channel.send("...? Anta honki ka?")
//         return
//     log("command:unreport: %s %s" % (reporter, reportee))
//     if db.unreport(reporter, reportee):
//         db.delete_request(reportee, reporter)
//         await msg.channel.send(reporter + " did a good deed and unreported " + reportee)
//     else:
//         await msg.channel.send("Sugoi! " + reporter + " doesn't have any reports for " + reportee)

// @bot.command()
// async function reported(msg: discord.Message, args: string[]):
//     if len(arg) != 1 and len(arg) != 2:
//         await msg.channel.send("Anta baka desu ka? Usage: " + mikuPrefix + "reported @user_reportee [ @user_reporter=self ]")
//         return
//     if len(arg) == 2:
//         reporter = fixId(arg[1])
//     else:
//         reporter = getEventOwnerTag(msg)
//     reportee = fixId(arg[0])
//     if isInvalidUserId(reporter) or isInvalidUserId(reportee):
//         await msg.channel.send("Are wa dare? Usage: " + mikuPrefix + "reported @reportee [ @reporter=self ]")
//         return
//     if isMiku(reportee):
//         await msg.channel.send("Such cute kidz... Kawaiii")
//         return
//     if reporter == reportee:
//         await msg.channel.send("Try reporting yourself! Nani? Omae wa mou shindeiru!!")
//         return
//     log("command:reported: %s %s" % (reporter, reportee))
//     response = db.get_report(reporter, reportee)
//     await msg.channel.send("%s reported %s %s times... %s" % response)

// @bot.command()
// async function reporter(msg: discord.Message, args: string[]):
//     if len(arg) > 1:
//         await msg.channel.send("Anata wa hontoni bakada! Usage: " + mikuPrefix + "reporter [ @reporter=self ]")
//         return
//     if len(arg) == 1:
//         user = fixId(arg[0])
//         if isInvalidUserId(user):
//             await msg.channel.send("Are wa dare? Usage: " + mikuPrefix + "reporter [ @reporter=self ]")
//             return
//         if isMiku(user):
//             await msg.channel.send("Miku is a good girl nyah! She doesn't report people nyaa..")
//             return
//     else:
//         user = getEventOwnerTag(msg)
//     log("command:reporter: " + user)
//     response = db.get_report_verbose("reporter", user)
//     if response:
//         await msg.channel.send(user + " reported all these bad people: " + response)
//     else:
//         await msg.channel.send(user + " hasn't reported anyone recently")

// @bot.command()
// async function reportee(msg: discord.Message, args: string[]):
//     if len(arg) > 1:
//         await msg.channel.send("Anata wa hontoni bakada! Usage: " + mikuPrefix + "reportee [ @reportee=self ]")
//         return
//     if len(arg) == 1:
//         user = fixId(arg[0])
//         if isInvalidUserId(user):
//             await msg.channel.send("Are wa dare? Usage: " + mikuPrefix + "reportee [ @reportee=self ]")
//             return
//         if isMiku(user):
//             await msg.channel.send("Miku is a good girl nyah! Noone wants to report her nyaa..")
//             return
//     else:
//         user = getEventOwnerTag(msg)
//     log("command:reportee: " + user)
//     response = db.get_report_verbose("reportee", user)
//     if response:
//         await msg.channel.send(user + " was reported by all these nice people: " + response)
//     else:
//         await msg.channel.send(user + " hasn't been reported by anyone recently")

// @bot.command()
// async function reports(msg: discord.Message, args: string[]):
//     if len(arg) > 1:
//         await msg.channel.send("Anata wa hontoni bakada! Usage: " + mikuPrefix + "reportee [ @reportee=self ]")
//         return
//     if len(arg) == 1:
//         user = fixId(arg[0])
//         if isInvalidUserId(user):
//             await msg.channel.send("Are wa dare? Usage: " + mikuPrefix + "reportee [ @reportee=self ]")
//             return
//         if isMiku(user):
//             await msg.channel.send("Miku is a good girl nyah! Noone wants to report her nyaa..")
//             return
//     else:
//         user = getEventOwnerTag(msg)
//     log("command:reports: " + user)
//     res = db.get_report_verbose("reporter", user)
//     if res:
//         response = user + " reported all these bad people: " + res + "\n"
//     else:
//         response = user + " hasn't reported anyone recently\n"
//     res = db.get_report_verbose("reportee", user)
//     if res:
//         response += user + " was reported by all these nice people: " + res
//     else:
//         response += user + " hasn't been reported by anyone recently"
//     await msg.channel.send(response)

// @bot.command()
// async function stats(msg: discord.Message, args: string[]):
//     if len(arg) > 1:
//         await msg.channel.send("Anata wa hontoni bakada! Usage: " + mikuPrefix + "stats [ @user=self ]")
//         return
//     if len(arg) == 1:
//         user = fixId(arg[0])
//         if isInvalidUserId(user):
//             await msg.channel.send("Are wa dare? Usage: " + mikuPrefix + "stats [ @user=self ]")
//             return
//     else:
//         user = getEventOwnerTag(msg)
//     log("command:stats: " + user)
//     response = db.get_report_aggregated(user)
//     await msg.channel.send("%s got reported %s times and reported others %s times :D" % response)

// @bot.command()
// async function approve(msg: discord.Message, args: string[]):
//     if len(arg) != 1:
//         await msg.channel.send("Invalid Syntax! Baaaka! Usage: " + mikuPrefix + "approve @requestor")
//         return
//     requestor = fixId(arg[0])
//     requestee = getEventOwnerTag(msg)
//     if isInvalidUserId(requestor):
//         await msg.channel.send("Are wa dare? Usage: " + mikuPrefix + "approve @requestor")
//         return
//     if isMiku(requestor):
//         await msg.channel.send("Miku doesn't report people, but Miku might change her mind if you keep this up!!")
//         return
//     log("command:approve: %s %s" % (requestor, requestee))
//     if db.unreport(requestee, requestor):
//         await msg.channel.send(requestor + ", " + requestee + " has approved your unreport request")
//     else:
//         await msg.channel.send(requestee + ", " + requestor + " has not requested any unreport")

// @bot.command()
// async function reject(msg: discord.Message, args: string[]):
//     if len(arg) != 1:
//         await msg.channel.send("Invalid Syntax! Baaaka! Usage: " + mikuPrefix + "reject @requestor")
//         return
//     requestor = fixId(arg[0])
//     requestee = getEventOwnerTag(msg)
//     if isInvalidUserId(requestor):
//         await msg.channel.send("Are wa dare? Usage: " + mikuPrefix + "approve @requestor")
//         return
//     if isMiku(requestor):
//         await msg.channel.send("Miku doesn't report people, but Miku might change her mind if you keep this up!!")
//         return
//     log("command:reject: %s %s" % (requestor, requestee))
//     if db.delete_request(requestor, requestee):
//         await msg.channel.send(requestor + ", " + requestee + " has rejected your unreport request")
//     else:
//         await msg.channel.send(requestee + ", " + requestor + " has not requested any unreport")
