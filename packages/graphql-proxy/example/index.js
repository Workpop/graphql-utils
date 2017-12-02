import express from 'express';
import { registerServices } from '../src';
import SERVICE_CONFIG from './config';

const app = express();

registerServices({
  SERVICE_CONFIG,
  server: app,
  enableGraphiql: true,
}).then(() => {
  app.listen(3020, () => {
    console.log('RUNNING ROXY'); // eslint-disable-line no-console
  });
});
