import * as path from 'path';
import * as dotenv from 'dotenv';

const envPath = path.join(__dirname, '..', '..', '.env');
dotenv.config({ path: envPath });

export default {
  port: process.env.PORT,
  jwtSecret: process.env.JWT_SECRET,
  appUrl: process.env.APP_URL,
  database: {
    host: process.env.POSTGRES_HOST,
    port: +process.env.POSTGRES_PORT,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DATABASE,
  },
  redis: {
    host: process.env.REDIS_HOST,
    port: +process.env.REDIS_PORT,
  },
  smtp: {
    from: process.env.SMTP_FROM,
    host: process.env.SMTP_HOST,
    port: +process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
  },
};
