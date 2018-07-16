import path from 'path';
import config from 'config';

import {
  log,
  delay,
  offerExists,
  bidExists,
  fileExists,
  getParkingOrderFilesDir,
} from '../../utils';
import { postChatMessage, uploadFile } from '../slack';
// Parking Spots
import getParkingOrders from './getParkingOrders';
import getCalendarDays from './getCalendarDays';

const slackConfig = config.get('slack');

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
        mrkdwnn: true,
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
