import { log, writeToCsv } from '../../utils';

const generateData = async ({ startDate, endDate, totalOffers }) => {
  try {
    const parkingOffers = [];
    for (let index = 0; index < totalOffers; index += 1) {
      parkingOffers.push({
        username: `user_${index + 1}`,
        startDate,
        endDate,
        loginCount: Math.floor(Math.random() * 20),
        itemsPurchased: Math.floor(Math.random() * 15),
        itemsReturned: Math.floor(Math.random() * 5),
      });
    }
    return parkingOffers;
  } catch (err) {
    throw err;
  }
};

export default async (options) => {
  try {
    const {
      startDate = '2018-01-01',
      endDate = '2018-07-11',
      totalOffers = 20,
      offersFilePath,
    } = options;

    const parkingOffers = await generateData({
      startDate,
      endDate,
      totalOffers,
    });

    if (parkingOffers.length > 0) {
      const headers = [
        'Username',
        'Start Date',
        'End Date',
        'Login Count',
        'Price',
      ];

      const offers = parkingOffers.map(offer => [
        offer.username,
        offer.startDate,
        offer.endDate,
        offer.loginCount,
        offer.price,
      ]);

      const filePath = offersFilePath;
      writeToCsv({ headers, offers, filePath });
      log.info(`${offers.length} parking spot offers compiled into ${filePath}`);
    }
  } catch (err) {
    throw err;
  }
};
