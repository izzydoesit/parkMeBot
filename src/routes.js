import express from 'express';
import { log } from './utils';
import { parkingPool } from './modules/reports';

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
        callback_id: 'findSpot',
        actions: [{
          name: 'date_select_menu',
          text: 'choose a date...',
          type: 'select',
          options: 'parkingSpotList'
        }]
      }]
    };
    return res.json(response);
  } catch (err) {
    return res.status(500).send('Something blew up. We\'re looking into it.');
  }
});

export default router;
