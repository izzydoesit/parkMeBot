import { log, writeToCsv } from '../../utils';

const generateData = async ({ startDate, endDate, totalSpots }) => {
  try {
    const parkingSpots = [];
    for (let index = 0; index < totalSpots; index++) {
      parkingSpots.push({
        username: `user_${index + 1}`,
        startDate,
        endDate,
        loginCount: Math.floor(Math.random() * 20),
        itemsPurchased: Math.floor(Math.random() * 15),
        itemsReturned: Math.floor(Math.random() * 5)
      });
    }
    return parkingSpots;
  } catch (err) {
    throw err;
  }
};

export default async (options) => {
  try {
    const {
      startDate = '2018-01-01',
      endDate = '2018-07-11',
      totalSpots = 20,
      spotsFilePath
    } = options;

    const parkingSpots = await generateData({
      startDate,
      endDate,
      totalSpots
    });

    if (parkingSpots.length > 0) {
      const headers = [
        'Username',
        'Start Date',
        'End Date',
        'Login Count',
        'Items Purchased',
        'Items Returned'
      ];

      const spots = parkingSpots.map(spot => [
        spot.username,
        spot.startDate,
        spot.endDate,
        spot.loginCount,
        spot.itemsPurchased,
        spot.itemsReturned
      ]);

      const filePath = spotsFilePath;
      writeToCsv({ headers, spots, filePath });
      log.info(`${spots.length} spots compiled into ${filePath}`);
    }
  } catch (err) {
    throw err;
  }
};
