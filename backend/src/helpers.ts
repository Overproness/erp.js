import fs from 'fs';
import moment from 'moment';
import currency from 'currency.js';

export { moment };

export const siteName: string = 'Express.js / MongoBD / Rest Api';

export const icon = (name: string): Buffer | null => {
  try {
    return fs.readFileSync(`./public/images/icons/${name}.svg`);
  } catch (error) {
    return null;
  }
};

export const image = (name: string): Buffer => {
  return fs.readFileSync(`./public/images/photos/${name}.jpg`);
};

export const timeRange = (start: string | Date, end: string | Date, format: string = 'HH:mm', interval: number = 60): string[] => {
  interval = interval > 0 ? interval : 60;
  const range: string[] = [];
  let current = moment(start);

  while (current.isBefore(moment(end))) {
    range.push(current.format(format));
    current = moment(current).add(interval, 'minutes');
  }

  return range;
};

export const calculate = {
  add: (a: number, b: number): number => currency(a).add(b).value,
  sub: (a: number, b: number): number => currency(a).subtract(b).value,
  multiply: (a: number, b: number): number => currency(a).multiply(b).value,
  divide: (a: number, b: number): number => currency(a).divide(b).value,
};

export default { moment, siteName, icon, image, timeRange, calculate };