import Botkit from 'botkit';
import config from 'config';

const controller = Botkit.slackbot({
  clientId: config.slack.parkMeBot.clientId,
  clientSecret: config.slack.parkMeBot.clientSecret,
  scopes: ['bot'],
});

controller.hears(
  ['hello', 'hi', 'yo', 'what\'s up'],
  ['direct_message', 'mention', 'direct_mention'],
  (bot, message) => {
    bot.reply(message, 'Hello yourself!');
  },
);

controller.hears('parking', 'in_channel', (bot, message) => {
  bot.reply(message, 'Did I hear parking? Maybe I can help...');
});

controller.on('channel_join', (bot, message) => {
  bot.reply(message, 'Welcome to the channel!');
});
