import path from 'path';
import config from 'config';
import {
  log,
  delay,
  offerExists,
  bidExists,
  fileExists,
  getListFilesDir,
} from '../../utils';
import { postChatMessage, uploadFile } from '../slack';
// Parking Spots
import getParkingOffers from './getParkingOffers';
import getParkingBids from './getParkingBids';

const slackConfig = config.get('slack');

const PARKING_OFFERS_CONFIG = {
  parkingOffers: {
    name: 'Parking Spot Offers',
    namePrefix: 'parkingOffers',
    type: 'csv',
    func: getParkingOffers,
  },
};

const PARKING_BIDS_CONFIG = {
  parkingBids: {
    name: 'Parking Spot Bids',
    namePrefix: 'parkingBids',
    type: 'csv',
    func: getParkingBids,
  },
};

export const parkingOffersList = Object.entries(PARKING_OFFERS_CONFIG)
  .map(([key, value]) => {
    const list = {
      text: value.name,
      value: key,
    };
    return list;
  });

export const parkingBidsList = Object.entries(PARKING_BIDS_CONFIG)
  .map(([key, value]) => {
    const list = {
      text: value.name,
      value: key,
    };
    return list;
  });

const generateListImplAsync = async (options, { slackReqObj }) => {
  const {
    listName,
    listTmpName,
    listType,
    listFilePath,
    listFunc,
  } = options;

  try {
    // initiate list function
    await listFunc();

    // delay to ensure previous fs call is done processing file
    await delay(250);
    const listExists = await fileExists(listFilePath);

    if (listExists === false) {
      const message = {
        responseUrl: slackReqObj.response_url,
        replaceOriginal: false,
        text: `There's currently no parking spot offers available for *${listName}*`,
        mrkdwnn: true,
        mrkdwn_in: ['text'],
      };
      return postChatMessage(message)
        .catch((ex) => {
          log.error(ex);
        });
    }

    // delay to ensure prvious fs call is done processing file
    await delay(250);
    const uploadedList = await uploadFile({
      filePath: listFilePath,
      fileTmpName: listTmpName,
      fileName: listName,
      fileType: listType,
      channels: slackConfig.parkMeBot.fileUploadChannel,
    });
    const message = {
      responseUrl: slackReqObj.response_url,
      replaceOriginal: false,
      text: 'Your list is ready!',
      attachmentns: [{
        text: `<${uploadedList.file.url_private}|${listName}>`,
        color: '#2c963f',
        footer: 'Click report link to open menu with download option',
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
      text: `Well this is embarassing :sweat: I couldn't successfully get the list *${listName}*. Please try again later as I look into what went wrong.`,
      mrkdwn: true,
      mrkdwn_in: ['text'],
    };
    return postChatMessage(message)
      .catch((ex) => {
        log.error(ex);
      });
  }
};

export const generateParkingOffersList = async (options) => {
  try {
    const { slackReqObj } = options;
    const offerKey = slackReqObj.actions[0].selected_options[0].value;
    const list = PARKING_OFFERS_CONFIG(offerKey);

    if (list === undefined) {
      const slackReqObjString = JSON.stringify(slackReqObj);
      log.error(new Error(`offerKey: ${offerKey} did not match any parking spot offers. slackReqObj: ${slackReqObjString}`));
      const response = {
        response_type: 'in_channel',
        text: 'Hmmm :thinking_face" Seems like that parking spot list is not available. Please try again later as I look into what went wrong.',
      };
      return response;
    }

    const listTmpName = `${list.namePrefix}_${Date.now()}.${list.type}`;
    const listFilesDir = getListFilesDir();
    const listFilePath = path.join(listFilesDir, listTmpName);

    const listParams = {
      listName: list.name,
      listTmpName,
      listType: list.type,
      listFilePath,
      listFunc() {
        return list.func({ listFilePath });
      },
    };

    // Begin async list generation
    generateListImplAsync(listParams, { slackReqObj });

    const response = {
      response_type: 'in_channel',
      text: `Got it :thumbsup: Generating requested list *${list.name}*\nI'll notify you when I'm done.`,
      mrkdwn: true,
      mrkdwnn_in: ['text'],
    };
    return response;
  } catch (err) {
    throw err;
  }
};

export const generateParkingBidsList = async (options) => {
  try {
    const { slackReqObj } = options;
    const offerKey = slackReqObj.actions[0].selected_options[0].value;
    const list = PARKING_BIDS_CONFIG(offerKey);

    if (list === undefined) {
      const slackReqObjString = JSON.stringify(slackReqObj);
      log.error(new Error(`offerKey: ${offerKey} did not match any parking spot offers. slackReqObj: ${slackReqObjString}`));
      const response = {
        response_type: 'in_channel',
        text: 'Hmmm :thinking_face" Seems like that parking spot list is not available. Please try again later as I look into what went wrong.',
      };
      return response;
    }

    const listTmpName = `${list.namePrefix}_${Date.now()}.${list.type}`;
    const listFilesDir = getListFilesDir();
    const listFilePath = path.join(listFilesDir, listTmpName);

    const listParams = {
      listName: list.name,
      listTmpName,
      listType: list.type,
      listFilePath,
      listFunc() {
        return list.func({ listFilePath });
      },
    };

    // Begin async list generation
    generateListImplAsync(listParams, { slackReqObj });

    const response = {
      response_type: 'in_channel',
      text: `Got it :thumbsup: Generating requested list *${list.name}*\nI'll notify you when I'm done.`,
      mrkdwn: true,
      mrkdwnn_in: ['text'],
    };
    return response;
  } catch (err) {
    throw err;
  }
};
