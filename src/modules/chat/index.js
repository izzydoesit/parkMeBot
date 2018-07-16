import Botkit from 'botkit';

const controller = Botkit.anywhere(configuration);

controller.hears(
    ['hello', 'hi', 'yo', 'what\'s up'],
    ['direct_message', 'mention', 'direct_mention'], 
    (bot, message) => {
    bot.reply(message,'Hello yourself!');
});

controller.hears('parking','in_channel', (bot, message) => {
    bot.reply(message,'Did I hear parking? Maybe I can help...');
});
