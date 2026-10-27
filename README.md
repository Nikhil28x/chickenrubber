# Raghav Chicken Machine Rubber

Mobile-first Svelte 5 / SvelteKit storefront and admin dashboard for Raghav Chicken Machine Rubber.

## Included

- Five-section responsive storefront with a 2×2 mobile product grid
- Four editable products with image, price, quantity and visibility controls
- Two product videos and a redesigned blue-and-white brand poster
- Call and WhatsApp links for `9900281928`
- Online order form with the requested Indian address fields
- Cash on delivery and UPI/QR options
- Neon PostgreSQL persistence for settings, products and orders
- Protected `/admin` dashboard for orders, product editing and business/media settings
- Optional Twilio WhatsApp/SMS, Resend email and generic webhook notifications

## Local setup

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and provide `DATABASE_URL` plus a strong `ADMIN_SESSION_SECRET`.
3. Initialize Neon: `npm run db:setup`
4. Start the app: `npm run dev`

The requested initial login is `admin` / `Password@123`. Set `ADMIN_USERNAME` and `ADMIN_PASSWORD` in the production environment before launch.

## Notification setup

Orders always appear in `/admin`. To deliver owner notifications through external services, configure:

- WhatsApp and SMS: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_SMS_FROM`, `TWILIO_WHATSAPP_FROM`
- Email: `RESEND_API_KEY`, `EMAIL_FROM`
- Any automation service: `ORDER_WEBHOOK_URL`

Notification delivery results are stored with each order in the `notifications` JSON column.

## Checks

```sh
npm run format:check
npm run check
npm run build
```

The Node adapter output is suitable for a Node-compatible host. Add the environment variables above in the host's settings; do not commit `.env`.
