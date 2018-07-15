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

export const spotExists = async (date) => {
  let exists = false;
  // check pool for spots on day

  return exists;
}

export const bidExists = async (date) => {
  let exists = false;
  // check pool for bids on day

  return exists;
}
