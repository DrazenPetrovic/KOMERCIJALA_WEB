import dotenv from 'dotenv';

const NODE_ENV = process.env.NODE_ENV || 'development';
dotenv.config({ path: `.env.${NODE_ENV}` });
dotenv.config();

export const env = {
  PORT: process.env.PORT || 3001,
  NODE_ENV,
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  JWT_SECRET: process.env.JWT_SECRET || 'change-me',
};
