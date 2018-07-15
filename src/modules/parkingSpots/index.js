import path from 'path';
import config from 'config';
import { log, delay, spotExists, bidExists } from '../../utils';

// Parking Spots
import getUserActivity from  './getUserActivity';

const slackConfig = config.get('slack');

const PARKING_SPOTS_CONFIG = {
  userActivity: {
    name: 'User Activity',
    namePrefix: 'userActivity',
    type: 'csv',
    func: getUserActivity
  }
};

export const parkingSpotList = Object.entries(PARKING_SPOTS_CONFIG)