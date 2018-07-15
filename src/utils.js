import fs from 'fs';
import path, { parse } from 'path';
import config from 'config';
import csvWriter from 'csv-write-stream';
import morgan from 'morgan';
import mkdirp from 'mkdirp';
import tracer from 'tracer';

export const log = (() => {
  const logger = tracer.colorConsole();
  logger.requestLogger = morgan('dev');
  return logger;
})();

export const normalizePort = (val) => {
  const port = parseInt(val, 10);
  if (Number.isNaN(port)) return val;
  if (port >= 0) return port;
  return false;
};

export const delay = time => new Promise((resolve) => {
  setTimeout(() => { resolve(); }, time);
});

export const fileExists = async (filePath) => {
  let exists = true;
  try {
    fs.accessSync(filePath);
  } catch (err) {
    if (err.code === 'ENOENT') {
      exists = false;
    } else {
      throw err;
    }
  }
  return exists;
};

export const writeToCsv = ({ headers, records, filePath }) => {
  const writer = csvWriter({ headers });
  writer.pipe(fs.createWriteStream(filePath));
  records.forEach(r => writer.write(r));
  writer.end();
};

export const getListFilesDir = () => {
  let listFilesDir;
  try {
    listFilesDir = path.join(__dirname, `../${config.get('listFilesDir')}`);
    mkdirp.sync(listFilesDir);
    return listFilesDir;
  } catch (err) {
    throw err;
  }
};

export const spotExists = async (date) => {
  let exists = false;
  // check pool for spots on day

  return exists;
};

export const bidExists = async (date) => {
  let exists = false;
  // check pool for bids on day

  return exists;
};
