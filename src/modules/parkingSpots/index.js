import path from 'path';
import config from 'config';
import { log, delay, spotExists, bidExists } from '../../utils';

// Parking Spots
import getParkingBids from  './getParkingBids';

const slackConfig = config.get('slack');

const PARKING_SPOTS_CONFIG = {
  userActivity: {
    name: 'Parking Spot Offers',
    namePrefix: 'parkingSpotOffers',
    type: 'csv',
    func: getParkingOffers
  }
};

export const parkingSpotList = Object.entries(PARKING_SPOTS_CONFIG)
  .map(([key, value]) => {
    const list = {
      text: value.name,
      value: key
    };
    return list;
  })