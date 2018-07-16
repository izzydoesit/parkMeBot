import { log } from '../../utils';
import { postChatMessage, sendDirectMessage } from '../slack';
import Couchbase from 'couchbase';
const cluster = new Couchbase.Cluster('couchbase://localhost:8000');
// cluster.authenticate('user', 'pass');
let orders = cluster.openBucket('orders');
let NQL = Couchbase.N1qlQuery;

orders.manager().createPrimaryIndex(() => {
  orders.upsert('id:Friday,Fri Jul 20 2018', {
    'userId': 'L33Tc0d3',
    'direction': 'B',
    'date': 'Sun Jul 15 2018'

  });
});

const millisecondsTS = Date.parse(input);
desiredDate = new Date(millisecondsTS);


const slackConfig = config.get('slack');

const findMatchingOrder = (date, type) => {
  const direction = (type === 'offer') ? 'B' : 'S';
  let matches = [];
  // search database by date
  results = orders.query(NQL.fromString(`SELECT META(order).id, order.* FROM orders AS order WHERE order.id LIKE $date AND order.direction = $direction`), {
    'date': date,
    'direction': direction,
  }, (err, result) => {
    if (errO)
  })

  return matches;
};

// Write order to database & check for matching order
export default async (options) => {
  try {
    const { slackReqObj } = options;
    const orderDate = slackReqObj.actions[0].selected_options[0].value;
    const orderDateTS = new Date(orderDate).toISOString();
=   const orderType = slackReqObj.callback_id;
    const orderDirection = (orderType === 'offer') ? 'S' : 'B';
    const userId = slackReqObj.userId;
    const now = new Date();

    orders.upsert(`${orderDateTS}:${Date.parse(now)}`, {
      'userId': userId,
      'direction': orderDirection,
      'date': orderDate,
    });

    const matchingOrderType = (orderDirection === 'S') ? 'B' : 'S';
    const matchingOrder = findMatchingOrder(orderDate, orderType)[0];

    const response;
    if (matchingOrder.length < 1) {
      response = {
        response_type: 'in_channel',
        text: `Thanks for your offer. We don't have any matching parking spot ${matchingOrderType}s right now, but we'll let you know when one becomes available.`,
      };
      return postChatMessage(response)
        .catch((err) => {
          log.error(err);
        });
    } else {
      const matchingUserId = matchingOrder.userId;
      response = {
        response_type: 'in_channel',
        text: `Thanks. Hey, I have great news, we found a matching ${matchingOrderType}. We'll message you two directly.`,
      };
      return postChatMessage(response)
      .catch((err) => {
        log.error(err);
      });

      // send direct message to user and matching order user
      const url = `https://slack.com/api/conversations.open?token=${process.env.SLACK_BOT_TOKEN}&return_im=true&users=${userId}%2C%20${matchingUserId}&pretty=1`;
      const intro = `Seems like you two have a lot to talk about! You're both interested in exchanging parking on ${orderDate}. Enjoy that spot!`
      const message = {
        url: url,
        replaceOriginal: false,
        text: intro,
        mrkdwn: true,
        mrkdwn_in: ['text'],
      };
      return sendDirectMessage(message).catch((ex) => {
        log.error(ex);
      });
    }
    return response;
  } catch (err) {
    throw err;
  }
}