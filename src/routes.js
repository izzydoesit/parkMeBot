import express from 'express';
import { log } from './utils';
import { parkingOffersList, generateParkingOffersList } from './modules/parkingLists';

const router = new express.Router();

router.post('/slack/command/parkme', async (req, res) => {
  try {
    const slackReqObj = req.body;
    const response = {
      response_type: 'in_channel',
      channel: slackReqObj.channel_id,
      text: 'Hello :slightly_smiling_face:',
      attachments: [{
        text: 'What day would you like to park?',
        fallback: 'What day would you like to park?',
        color: '#2c963f',
        attachment_type: 'default',
        callback_id: 'spot_selection',
        actions: [{
          name: 'date_select_menu',
          text: 'choose a date...',
          type: 'select',
          options: 'parkingSpotOffers',
        }],
      }],
    };
    return res.json(response);
  } catch (err) {
    return res.status(500).send('Something blew up. We\'re looking into it.');
  }
});

router.post('/slack/actions', async (req, res) => {
  try {
    const slackReqObj = JSON.parse(req.body.payload);
    let response;
    if (slackReqObj.callback_id === 'spot_selection') {
      response = await generateParkingOffersList({ slackReqObj });
    }
    return res.json(response);
  } catch (err) {
    log.error(err);
    return res.status(500).send('Something blew up. We\'re looking into it');
  }
});

export default router;
