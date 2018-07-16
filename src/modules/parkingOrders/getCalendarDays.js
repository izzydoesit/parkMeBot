import { log } from '../../utils';

export default (totalDays = 7) => {
  const days = [];
  const date = new Date();
  for (let i = 1; i <= totalDays; i += 1) {
    date.setDate(date.getDate() + 1);
    days.push({ 
      text: date.toDateString(),
      value: i.toString(),
    });
  }
  return days;
};