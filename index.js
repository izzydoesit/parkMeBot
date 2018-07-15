const result = require('dotenv').config();
if (result.error) {
  throw result.error;
}
console.log(result.parsed);

const Botkit = require('botkit');
const controller = Botkit.anywhere(configuration);

controller.hears('hello','direct_message', (bot, message) => {
    bot.reply(message,'Hello yourself!');
});
