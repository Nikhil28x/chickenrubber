# Naazare Enterprises

Mobile-first Svelte 5 / SvelteKit storefront and admin dashboard for Naazare Enterprises — dealers in commercial kitchen equipment since 2004.

## Included

- Responsive storefront: info bar, header, hero, highlights strip, About Us, product frames, videos, callback form and footer
- Product frames: rows of four products, each switched on or off from `/admin` (new frames appear below the live ones)
- Six frames seeded on first run — Rubbers & bushes is live, the others are hidden until filled in
- Each product has three photos, one video, price, quantity and visibility controls
- Call and WhatsApp links for `9900281928`
- "Request a callback" form (name, phones, location, product of interest, message) — no online payment
- Neon PostgreSQL persistence for settings, frames, products and callback requests
- Protected `/admin` dashboard for callback requests, product frames and business/media settings
- Optional Twilio WhatsApp/SMS, Resend email and generic webhook notifications

## Local setup

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and provide `DATABASE_URL` plus a strong `ADMIN_SESSION_SECRET`.
3. Initialize Neon: `npm run db:setup`
4. Start the app: `npm run dev`

The requested initial login is `admin` / `Password@123`. Set `ADMIN_USERNAME` and `ADMIN_PASSWORD` in the production environment before launch.

## Notification setup

Callback requests always appear in `/admin`. To deliver owner notifications through external services, configure:

- WhatsApp and SMS: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_SMS_FROM`, `TWILIO_WHATSAPP_FROM`
- Email: `RESEND_API_KEY`, `EMAIL_FROM`
- Any automation service: `ORDER_WEBHOOK_URL`

Notification delivery results are stored with each request in the `notifications` JSON column.

## Checks

```sh
npm run format:check
npm run check
npm run build
```

The Node adapter output is suitable for a Node-compatible host. Add the environment variables above in the host's settings; do not commit `.env`.
