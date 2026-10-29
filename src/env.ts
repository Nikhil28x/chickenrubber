import { defineEnvVars } from '@sveltejs/kit/env';

const optional = (value: string | undefined) => value;

export const variables = defineEnvVars({
  DATABASE_URL: { schema: optional, description: 'Neon PostgreSQL connection string' },
  ADMIN_USERNAME: { schema: optional },
  ADMIN_PASSWORD: { schema: optional },
  ADMIN_SESSION_SECRET: { schema: optional },
  TWILIO_ACCOUNT_SID: { schema: optional },
  TWILIO_AUTH_TOKEN: { schema: optional },
  TWILIO_WHATSAPP_FROM: { schema: optional },
  TWILIO_SMS_FROM: { schema: optional },
  RESEND_API_KEY: { schema: optional },
  EMAIL_FROM: { schema: optional },
  ORDER_WEBHOOK_URL: { schema: optional }
});
