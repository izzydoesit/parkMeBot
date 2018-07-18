import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import config from 'config';
import { log } from './utils';
import routes from './routes';

const user = config.slack.parkMeBot.dbUser;
const pass = config.slack.parkMeBot.dbPass;
const mongoLab = `mongodb://${user}:${pass}@ds239911.mlab.com:39911/parkmebotdb`;
const options = { useNewUrlParser: true, keepAlive: 1 };
mongoose.connect(mongoLab, options, (err) => {
  if (err) {
    return log.error(err);
  }
  return log.info('Connected to MongoLab Database...');
});

export default function (app) {
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  // Routes
  app.use(routes);

  // 404
  app.use((req, res) => {
    res.status(404).send({
      status: 404,
      message: 'The requested resource was not found',
    });
  });

  // 5xx
  app.use((err, req, res) => {
    log.error(err.stack);
    const message = process.env.NODE_ENV === 'production'
      ? 'Something went wrong, we\'re looking into it...'
      : err.stack;
    res.status(500).send({
      status: 500,
      message,
    });
  });
}
