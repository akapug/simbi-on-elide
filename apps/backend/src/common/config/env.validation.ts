import * as Joi from 'joi';

/**
 * Environment variable validation schema
 * Validates all critical environment variables on application startup
 * Fail-fast approach to prevent runtime errors from missing configuration
 */
export const envValidationSchema = Joi.object({
  // Application
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'staging')
    .default('development'),
  PORT: Joi.number().default(3000),
  API_PREFIX: Joi.string().default('api/v1'),
  FRONTEND_URL: Joi.string().uri().required(),

  // Database (Required)
  DATABASE_URL: Joi.string()
    .required()
    .description('PostgreSQL connection string is required'),

  // JWT Authentication (Required)
  JWT_SECRET: Joi.string()
    .min(32)
    .required()
    .description('JWT secret must be at least 32 characters'),
  JWT_EXPIRES_IN: Joi.string().default('7d'),
  JWT_REFRESH_SECRET: Joi.string().min(32).optional(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('30d'),

  // Redis (Required)
  REDIS_HOST: Joi.string()
    .required()
    .description('Redis host is required for caching and queues'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().optional(),

  // MeiliSearch (Optional but recommended)
  MEILISEARCH_HOST: Joi.string().uri().optional(),
  MEILISEARCH_API_KEY: Joi.string().optional(),

  // OAuth - Google (Optional)
  GOOGLE_CLIENT_ID: Joi.string().optional(),
  GOOGLE_CLIENT_SECRET: Joi.string().optional(),
  GOOGLE_CALLBACK_URL: Joi.string().uri().optional(),

  // OAuth - Facebook (Optional)
  FACEBOOK_APP_ID: Joi.string().optional(),
  FACEBOOK_APP_SECRET: Joi.string().optional(),
  FACEBOOK_CALLBACK_URL: Joi.string().uri().optional(),

  // Stripe Payments (Optional)
  STRIPE_SECRET_KEY: Joi.string().optional(),
  STRIPE_PUBLISHABLE_KEY: Joi.string().optional(),
  STRIPE_WEBHOOK_SECRET: Joi.string().optional(),

  // Email (Optional)
  SMTP_HOST: Joi.string().optional(),
  SMTP_PORT: Joi.number().optional(),
  SMTP_USER: Joi.string().optional(),
  SMTP_PASS: Joi.string().optional(),
  SMTP_FROM: Joi.string().email().optional(),

  // AWS S3 (Optional)
  AWS_ACCESS_KEY_ID: Joi.string().optional(),
  AWS_SECRET_ACCESS_KEY: Joi.string().optional(),
  AWS_REGION: Joi.string().optional(),
  AWS_S3_BUCKET: Joi.string().optional(),

  // Cloudinary (Optional)
  CLOUDINARY_CLOUD_NAME: Joi.string().optional(),
  CLOUDINARY_API_KEY: Joi.string().optional(),
  CLOUDINARY_API_SECRET: Joi.string().optional(),

  // WebSocket
  WEBSOCKET_PORT: Joi.number().default(3001),

  // Security
  RATE_LIMIT_TTL: Joi.number().default(60000),
  RATE_LIMIT_MAX: Joi.number().default(100),
  BCRYPT_ROUNDS: Joi.number().min(10).max(15).default(10),

  // Logging
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug', 'verbose')
    .default('info'),
})
  .custom((value, helpers) => {
    // Custom validation: If Google OAuth is enabled, all Google fields must be present
    if (value.GOOGLE_CLIENT_ID || value.GOOGLE_CLIENT_SECRET || value.GOOGLE_CALLBACK_URL) {
      if (!value.GOOGLE_CLIENT_ID || !value.GOOGLE_CLIENT_SECRET || !value.GOOGLE_CALLBACK_URL) {
        return helpers.error('any.custom', {
          message: 'Google OAuth requires GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_CALLBACK_URL',
        });
      }
    }

    // Custom validation: If Facebook OAuth is enabled, all Facebook fields must be present
    if (value.FACEBOOK_APP_ID || value.FACEBOOK_APP_SECRET || value.FACEBOOK_CALLBACK_URL) {
      if (!value.FACEBOOK_APP_ID || !value.FACEBOOK_APP_SECRET || !value.FACEBOOK_CALLBACK_URL) {
        return helpers.error('any.custom', {
          message: 'Facebook OAuth requires FACEBOOK_APP_ID, FACEBOOK_APP_SECRET, and FACEBOOK_CALLBACK_URL',
        });
      }
    }

    // Custom validation: If Stripe is enabled, all Stripe fields must be present
    if (value.STRIPE_SECRET_KEY || value.STRIPE_PUBLISHABLE_KEY) {
      if (!value.STRIPE_SECRET_KEY || !value.STRIPE_PUBLISHABLE_KEY) {
        return helpers.error('any.custom', {
          message: 'Stripe requires both STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY',
        });
      }
    }

    return value;
  });

/**
 * Validate environment variables
 * Throws an error with details about missing/invalid variables
 */
export function validateEnvironment(config: Record<string, unknown>) {
  const { error, value } = envValidationSchema.validate(config, {
    abortEarly: false,
    allowUnknown: true,
  });

  if (error) {
    const errors = error.details.map((detail) => detail.message).join(', ');
    throw new Error(`Environment validation failed: ${errors}`);
  }

  return value;
}
