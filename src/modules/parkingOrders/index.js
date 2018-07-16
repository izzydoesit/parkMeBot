import config from 'config';
import path from 'path';
const result = require('dotenv').config();
if (result.error) {
  throw result.error;
}

import {
  log,
  delay,
  offerExists,
  bidExists,
  fileExists,
  getParkingOrderFilesDir,
} from '../../utils';
import Couchbase from 'couchbase';
const cluster = new Couchbase.Cluster('couchbase://localhost:8000');
let orders = cluster.openBucket('orders');
let NQL = Couchbase.N1qlQuery;
import { postChatMessage, sendDirectMessage, uploadFile } from '../slack';
// Parking Spots
import getParkingOrders from './getParkingOrders';
import getCalendarDays from './getCalendarDays';
import { resolve } from 'url';

const slackConfig = config.get('slack');

const findMatchingOrder = (date, type) => {
  const direction = (type === 'offer') ? 'B' : 'S';
  let matches = [];
  // search database by date
  results = orders.query(NQL.fromString(`SELECT META(order).id, order.* FROM orders AS order WHERE order.id LIKE $date AND order.direction = $direction LIMIT 1`), {
    'date': date,
    'direction': direction,
  }, (err, result) => {
    if (err) throw err;
    resolve(result.value);
  })

  return matches;
};

// Write order to database & check for matching order
export const submitOrder = async (options) => {
  try {
    console.log('IN SUBMIT ORDER')
    const { slackReqObj } = options;
    console.log('slack obj', slackReqObj);
    const orderDate = slackReqObj.actions[0].selected_options[0].value;
    const orderDateTS = new Date(orderDate).toISOString();
    const orderType = slackReqObj.callback_id;
    const orderDirection = (orderType === 'offer') ? 'S' : 'B';
    const userId = slackReqObj.userId;
    const now = new Date();

    orders.upsert(`${orderDateTS}:${Date.parse(now)}`, {
      'userId': userId,
      'direction': orderDirection,
      'date': orderDate,
    }, (err, result) => {
      if (err) throw err;
      resolve(result.value);
    });

    const matchingOrder = findMatchingOrder(orderDate, orderDirection)[0];

    let response;
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
};

const PARKING_ORDERS_CONFIG = {
  offer: {
    name: 'Parking Spot Offers',
    namePrefix: 'parkingOffers',
    type: 'csv',
    func: getParkingOrders,
  },
  bid: {
    name: 'Parking Spot Bids',
    namePrefix: 'parkingBids',
    type: 'csv',
    func: getParkingOrders,
  },
};

export const orderTypesList = Object.entries(PARKING_ORDERS_CONFIG)
.map(([key, value]) => {
  const orderType = {
    text: value.name,
    value: key,
  };
  return orderType;
});

export const generateOrderReport = async (options) => {
  try {
    const { slackReqObj } = options;
    const orderType = slackReqObj.actions[0].selected_options[0].value;
    const orderReport = PARKING_ORDERS_CONFIG[orderType];

    if (orderReport === undefined) {
      const slackReqObjString = JSON.stringify(slackReqObj);
      log.error(new Error(`orderType: ${orderType} did not match any order types. slackReqObj: ${slackReqObjString}`));
      const response = {
        response_type: 'in_channel',
        text: 'Hmmm :thinking_face: Seems like that order type list is not available. Please try again later as we look into what went wrong.',
      };
      return response;
    }

    const orderReportTmpName = `${orderReport.namePrefix}_${Date.now()}.${orderReport.type}`;
    const orderReportFilesDir = getParkingOrderFilesDir();
    const orderReportFilePath = path.join(orderReportFilesDir, orderReportTmpName);

    const orderReportParams = {
      orderReportName: orderReport.name,
      orderType,
      orderReportTmpName,
      orderReportType: orderReport.type,
      orderReportFilePath,
      orderReportFunc() {
        return orderReport.func({ orderType, orderReportFilePath });
      }
    };

    // Begin async order report generation
    generateOrderReportImplAsync(orderReportParams, { slackReqObj });

    const response = {
      response_type: 'in_channel',
      text: `Got it :thumbsup: Generating requested order report *${orderReport.name}*\nI'll notify you when I'm done.`,
      mrkdwn: true,
      mrkdwn_in: ['text'],
    };
    return response;
  } catch (err) {
    throw err;
  }
};

const generateOrderReportImplAsync = async (options, { slackReqObj }) => {
  const {
    orderReportName,
    orderReportTmpName,
    orderReportType,
    orderReportFilePath,
    orderReportFunc,
  } = options;

  try {
    // initiate order report function
    await orderReportFunc();
    // delay to ensure previous fs call is done processing file
    await delay(250);
    const orderReportExists = await fileExists(orderReportFilePath);

    if (orderReportExists === false) {
      const message = {
        responseUrl: slackReqObj.response_url,
        replaceOriginal: false,
        text: `There's currently no orders available for *${orderReportName}*`,
        mrkdwn: true,
        mrkdwn_in: ['text'],
      };
      return postChatMessage(message)
        .catch((ex) => {
          log.error(ex);
        });
    }
    // delay to ensure previous fs call is done processing file
    await delay(250);
    const uploadedOrderReport = await uploadFile({
      filePath: orderReportFilePath,
      fileTmpName: orderReportTmpName,
      fileName: orderReportName,
      fileType: orderReportType,
      channels: slackConfig.parkMeBot.fileUploadChannel,
    });

    const message = {
      responseUrl: slackReqObj.response_url,
      replaceOriginal: false,
      text: 'Your order report is ready!',
      attachmentns: [{
        text: `<${uploadedOrderReport.file.url_private}|${orderReportName}>`,
        color: '#2c963f',
        footer: 'Click order report link to open menu with download option',
      }],
    };

    return postChatMessage(message)
      .catch((err) => {
        log.error(err);
      });
  } catch (err) {
    log.error(err);

    const message = {
      responseUrl: slackReqObj.response_url,
      replaceOriginal: false,
      text: `Well this is embarassing :sweat: I couldn't successfully get the order report *${orderReportName}*. Please try again later as I look into what went wrong.`,
      mrkdwn: true,
      mrkdwn_in: ['text'],
    };
    
    return postChatMessage(message)
      .catch((ex) => {
        log.error(ex);
      });
  }
};

export const calendarDaysList = getCalendarDays(7);
