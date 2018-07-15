import { log, writeToCsv } from '../../utils';

const generateData = async ({ startDate, endDate, totalBids }) => {
  try {
    const parkingBids = [];
    for (let index = 0; index < totalBids; index += 1) {
      parkingBids.push({
        username: `user_${index + 1}`,
        startDate,
        endDate,
        loginCount: Math.floor(Math.random() * 20),
        itemsPurchased: Math.floor(Math.random() * 15),
        itemsReturned: Math.floor(Math.random() * 5),
      });
    }
    return parkingBids;
  } catch (err) {
    throw err;
  }
};

export default async (options) => {
  try {
    const {
      startDate = '2018-01-01',
      endDate = '2018-07-11',
      totalBids = 20,
      bidsFilePath,
    } = options;

    const parkingBids = await generateData({
      startDate,
      endDate,
      totalBids,
    });

    if (parkingBids.length > 0) {
      const headers = [
        'Username',
        'Start Date',
        'End Date',
        'Login Count',
      ];

      const bids = parkingBids.map(bids => [
        bids.username,
        bids.startDate,
        bids.endDate,
        bids.loginCount,
      ]);

      const filePath = offersFilePath;
      writeToCsv({ headers, bids, filePath });
      log.info(`${offers.length} parking spot bids compiled into ${filePath}`);
    }
  } catch (err) {
    throw err;
  }
};
