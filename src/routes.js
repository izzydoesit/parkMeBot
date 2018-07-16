import express from 'express';
import { log } from './utils';
import { 
  orderTypesList,
  generateOrderReport,
  calendarDaysList,
} from './modules/parkingOrders';

const router = new express.Router();

router.post('/slack/command/parkingspots', async (req, res) => {
  try {
    const slackReqObj = req.body;
    const response = {
      response_type: 'in_channel',
      channel: slackReqObj.channel_id,
      text: 'Hello :slightly_smiling_face:',
      attachments: [{
        text: 'What orders would you like to see?',
        fallback: 'What orders would you like to see?',
        color: '#2c963f',
        attachment_type: 'default',
        callback_id: 'order_type_selection',
        actions: [{
          name: 'order_types_select_menu',
          text: 'choose an order type...',
          type: 'select',
          options: orderTypesList,
        }],
      }],
    };
    return res.json(response);
  } catch (err) {
    return res.status(500).send('Something blew up. We\'re looking into it.');
  }
});

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
        callback_id: 'calendar_selection',
        actions: [{
          name: 'date_select_menu',
          text: 'choose a date...',
          type: 'select',
          options: calendarDaysList,
        }],
      }],
    };
    return res.json(response);
  } catch (err) {
    return res.status(500).send('Something blew up. We\'re looking into it.');
  }
});

router.post('/slack/command/rentspot', async (req, res) => {
  try {
    const slackReqObj = req.body;
    const response = {
      response_type: 'in_channel',
      channel: slackReqObj.channel_id,
      text: 'Hello :slightly_smiling_face:',
      attachments: [{
        text: 'What day would you like to offer parking?',
        fallback: 'What day would you like to offer parking?',
        color: '#2c963f',
        attachment_type: 'default',
        callback_id: 'calendar_selection',
        actions: [{
          name: 'date_select_menu',
          text: 'choose a date...',
          type: 'select',
          options: calendarDaysList,
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

    if (slackReqObj.callback_id === 'calendar_selection') {
      response = await submitOrder({ slackReqObj });
    } else if (slackReqObj.callback_id === 'order_type_selection') {
      response = await generateOrderReport({ slackReqObj });
    }
    return res.json(response);
  } catch (err) {
    log.error(err);
    return res.status(500).send('Something blew up. We\'re looking into it');
  }
});

export default router;
