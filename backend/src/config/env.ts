import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

export const config = {
  // Server
  PORT: parseInt(process.env.BACKEND_PORT || '5000', 10),
  BASE_URL: process.env.BASE_URL || `http://localhost:${process.env.BACKEND_PORT || '5000'}`,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database
  DATABASE_URL: process.env.DATABASE_URL!,
  DB_HOST: process.env.DB_HOST,
  DB_PORT: parseInt(process.env.DB_PORT || '5432', 10),
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_NAME: process.env.DB_NAME,

  // JWT
  JWT_SECRET: process.env.JWT_SECRET!,
  JWT_EXPIRE_IN: process.env.JWT_EXPIRE_IN || '7d',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
  JWT_REFRESH_EXPIRE_IN: process.env.JWT_REFRESH_EXPIRE_IN || '30d',

  // CORS
  CORS_ORIGIN: (process.env.CORS_ORIGIN || 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim()),
  CORS_CREDENTIALS: process.env.CORS_CREDENTIALS === 'true',

  // Email
  EMAIL: {
    SERVICE: process.env.EMAIL_SERVICE || 'hostinger',
    HOST: process.env.EMAIL_HOST!,
    PORT: parseInt(process.env.EMAIL_PORT || '587', 10),
    USER: process.env.EMAIL_USER!,
    PASSWORD: process.env.EMAIL_PASSWORD!,
    FROM_NAME: process.env.EMAIL_FROM_NAME || 'Snap\'s Mirror',
    FROM_EMAIL: process.env.EMAIL_FROM_EMAIL!,
    SUPPORT_EMAIL: process.env.SUPPORT_EMAIL!,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL!,
  },

  // Payment Gateways
  JAZZCASH: {
    ENABLED: process.env.JAZZCASH_ENABLED === 'true',
    MERCHANT_ID: process.env.JAZZCASH_MERCHANT_ID,
    PASSWORD: process.env.JAZZCASH_PASSWORD,
    ACCOUNT: process.env.JAZZCASH_ACCOUNT_NUMBER || '03244612168',
  },

  EASYPAISA: {
    ENABLED: process.env.EASYPAISA_ENABLED === 'true',
    MERCHANT_ID: process.env.EASYPAISA_MERCHANT_ID,
    PASSWORD: process.env.EASYPAISA_PASSWORD,
    ACCOUNT: process.env.EASYPAISA_ACCOUNT_NUMBER || '03141016293',
  },

  BANK_TRANSFER: {
    ENABLED: process.env.BANK_TRANSFER_ENABLED === 'true',
    BANK_NAME: process.env.BANK_NAME || 'JS Bank',
    ACCOUNT_NUMBER: process.env.BANK_ACCOUNT_NUMBER || '03244612168',
    ACCOUNT_HOLDER: process.env.BANK_ACCOUNT_HOLDER || 'Snap Mirror',
  },

  // File Upload
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10),
  ALLOWED_FILE_TYPES: (process.env.ALLOWED_FILE_TYPES || 'jpg,jpeg,png,webp').split(','),

  // Business Info
  BUSINESS: {
    NAME: process.env.BUSINESS_NAME || 'Snap\'s Mirror',
    EMAIL: process.env.BUSINESS_EMAIL!,
    PHONE: process.env.BUSINESS_PHONE!,
    WHATSAPP: process.env.BUSINESS_WHATSAPP!,
  },

  // Delivery
  DELIVERY: {
    SHIPPING_CHARGE: parseInt(process.env.STANDARD_SHIPPING_CHARGE || '415', 10),
    MIN_DAYS: parseInt(process.env.DELIVERY_MIN_DAYS || '2', 10),
    MAX_DAYS: parseInt(process.env.DELIVERY_MAX_DAYS || '3', 10),
    CURRENCY: process.env.DELIVERY_CURRENCY || 'PKR',
  },

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'debug',
  LOG_FILE: process.env.LOG_FILE || 'logs/app.log',

  // API URLs
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  ADMIN_URL: process.env.ADMIN_URL || 'http://localhost:3001',

  // Social Media
  SOCIAL: {
    INSTAGRAM: process.env.INSTAGRAM_USERNAME || 'snap_mirrors',
    TIKTOK: process.env.TIKTOK_USERNAME || '@aina_zaar1',
    DARAZ: process.env.DARAZ_SHOP_ID || 'mrshop-1607516943',
    YOUTUBE: process.env.YOUTUBE_URL,
    FACEBOOK: process.env.FACEBOOK_URL,
  },
};

// Validate required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'EMAIL_HOST',
  'EMAIL_USER',
  'EMAIL_PASSWORD',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.warn(`⚠️  Missing required environment variable: ${envVar}`);
  }
}

export default config;
