import dotenv from 'dotenv';
dotenv.config();

export const CONFIG = {
  nodeEnv: process.env.NODE_ENV || 'development',
  fetchApi: {
    baseUrl: process.env.FETCH_API_URL || 'http://localhost:3000',
    scrapeEndpoint: '/fetch',
  },
  scheduler: {
    schedulesDir: process.env.SCHEDULES_DIR || './src/schedules',
    timezone: process.env.TIMEZONE || 'America/Lima',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};
