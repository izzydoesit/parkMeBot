import { log, writeToCsv } from '../../utils';

// GENERATES MOCK RECORDS UP TO AMOUNT OF TOTAL ORDERS
const generateData = async ({ startDate, endDate, totalOrders, direction }) => {
  try {
    const parkingOrders = [];
    for (let index = 0; index < totalOrders; index += 1) {
      const rand = Math.floor(Math.random() * 7) + 1;
      const randomDay = new Date();
      randomDay.setDate(randomDay.getDate() + rand);

      parkingOrders.push({
        id: Math.floor(Math.random() * 25),
        direction: direction,
        username: `user_${index + 1}`,
        date: randomDay,
      });
    }
    return parkingOrders;
  } catch (err) {
    throw err;
  }
};

// GENERATES CSV VILE OF MOCKED ORDERS
export default async (options) => {
  try {
    const {
      startDate = '2018-01-01',
      endDate = '2018-07-11',
      totalOrders = 20,
      orderType,
      orderReportFilePath,
    } = options;

    const direction = (orderType == 'offers') ? 'S' : 'B';
    const parkingOrders = await generateData({
      startDate,
      endDate,
      totalOrders,
      direction
    });

    if (parkingOrders.length > 0) {
      const headers = [
        'Order Id',
        'Direction',
        'Username',
        'Date',
      ];

      const orders = parkingOrders.map(order => [
        order.id,
        order.direction,
        order.username,
        order.date,
      ]);

      const filePath = orderReportFilePath;
      writeToCsv({ headers, records: orders, filePath });
      const dir = direction === 'S' ? 'offer' : 'bid';
      log.info(`${orders.length} parking spot ${dir} orders compiled into ${filePath}`);
    }
  } catch (err) {
    throw err;
  }
};
