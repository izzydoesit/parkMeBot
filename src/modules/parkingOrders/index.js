import config, { botToken } from 'config';
import path from 'path';
import mongoose, { Schema } from 'mongoose';
import {
  log,
  delay,
  fileExists,
  getParkingOrderFilesDir,
} from '../../utils';
import { postChatMessage, sendDirectMessage, uploadFile } from '../slack';
import getParkingOrders from './getParkingOrders';
import getCalendarDays from './getCalendarDays';

const slackConfig = config.get('slack');

mongoose.set('debug', true);
const OrderSchema = new Schema({
  id: String,
  userId: String,
  direction: String,
  date: String,
});
const Order = mongoose.model('Order', OrderSchema);

const findMatchingOrder = async (date, type) => {
  try {
    // search database by date + direction
    const direction = (type === 'offer') ? 'B' : 'S';
    const matchOrder = Order.findOne({}, (err, item) => {
      if (err) return log.error(err);
      return log.info('Found matching item in database:', item);
    });

    const results = await matchOrder.where({
      date,
      direction,
    }, (err, match) => {
      if (err) return log.error(err);
      return log.info('Found matching order', match);
    });

    if (results) {
      log.info('Matched order with %s on %s in %s direction.', results.userId, results.date, results.direction);
    } else {
      return log.error('Something went wrong searching for your order', results);
    }
    return results;
  } catch (err) {
    throw err;
  }
};

// Write order to database & check for matching order
export const submitOrder = async (options) => {
  try {
    // console.log('IN SUBMIT ORDER')
    const { slackReqObj } = options;
    // console.log('slack obj', slackReqObj);
    const orderDate = slackReqObj.actions[0].selected_options[0].value;
    const orderDateTS = new Date(orderDate).toISOString();
    const orderType = slackReqObj.callback_id.split('_')[0];
    const orderDirection = (orderType === 'offer') ? 'S' : 'B';
    const matchingOrderType = (orderType === 'offer') ? 'request' : 'offer';
    const userId = slackReqObj.user.id;
    const now = new Date();

    const newOrder = new Order({
      id: `${orderDateTS}:${Date.parse(now)}`,
      userId,
      direction: orderDirection,
      date: orderDate,
    });

    newOrder.save(((err) => {
      if (err) return err;
      return log.info(`Your ${orderType} for ${orderDate} has been saved!`);
    }));

    const matchingOrder = await findMatchingOrder(orderDate, orderDirection);

    const response = {
      responseUrl: slackReqObj.response_url,
      replaceOriginal: false,
      mrkdwn: true,
      mrkdwn_in: ['text'],
    };

    if (matchingOrder !== null) {
      response.text = `Hey, I have great news! :tada: :clap: We found a matching ${matchingOrderType}. :smiley: We'll message you two directly...`;

      // send direct message to user and matching order user
      const matchingUserId = matchingOrder.userId;
      const url = `https://slack.com/api/conversations.open?token=${botToken}&return_im=true&users=${matchingUserId}&pretty=1`;
      const intro = `Seems like you two have a lot to talk about! You're both interested in exchanging parking on ${orderDate}. Enjoy that spot!`;
      const message = {
        url,
        replaceOriginal: false,
        text: intro,
        mrkdwn: true,
        mrkdwn_in: ['text'],
      };
      sendDirectMessage(message)
        .catch((ex) => {
          log.error(ex);
        });
    } else {
      response.text = `Thanks for your offer. :heart_eyes: We don't have any matching parking spot ${matchingOrderType}s right now, but we'll let you know as soon as one becomes available. :+1:`;
    }
    return response;
  } catch (err) {
    throw err;
  }
};

const PARKING_ORDERS_CONFIG = {
  offers: {
    name: 'Parking Spot Offers',
    namePrefix: 'parkingOffers',
    type: 'csv',
    func: getParkingOrders,
  },
  bids: {
    name: 'Parking Spot Bids',
    namePrefix: 'parkingBids',
    type: 'csv',
    func: getParkingOrders,
  },
};

export const generateOrderReport = async (options) => {
  try {
    const { slackReqObj } = options;
    const orderType = slackReqObj.actions[0].value;
    const orderReport = PARKING_ORDERS_CONFIG[orderType];
    const channel = `${slackReqObj.channel.id} -- ${slackReqObj.channel.domain}`;
    const user = `${slackReqObj.user.id} -- ${slackReqObj.user.name}`;
    log.info(`Generating order report for parking spot ${orderType} sent from ${channel} by ${user}`)

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
      },
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
