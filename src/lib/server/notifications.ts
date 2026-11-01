type CallbackRequest = {
  requestNumber: string;
  customerName: string;
  mobile: string;
  location: string;
  product: string;
  message: string;
};

function message(request: CallbackRequest) {
  return [
    `New callback request #${request.requestNumber}`,
    `Customer: ${request.customerName}`,
    `Mobile: ${request.mobile}`,
    `Location: ${request.location}`,
    `Interested in: ${request.product}`,
    request.message && `Note: ${request.message}`
  ]
    .filter(Boolean)
    .join('\n');
}

async function sendTwilio(to: string, from: string, body: string) {
  const sid = TWILIO_ACCOUNT_SID;
  const token = TWILIO_AUTH_TOKEN;
  if (!sid || !token || !from) return 'not_configured';

  const form = new URLSearchParams({ To: to, From: from, Body: body });
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: form
  });
  return response.ok ? 'sent' : `failed_${response.status}`;
}

export async function notifyOwner(
  request: CallbackRequest,
  owner: { phone: string; whatsapp: string; email: string }
) {
  const body = message(request);
  const results: Record<string, string> = {
    whatsapp: 'not_configured',
    sms: 'not_configured',
    email: 'not_configured',
    webhook: 'not_configured'
  };

  try {
    results.whatsapp = await sendTwilio(
      `whatsapp:+91${owner.whatsapp.replace(/\D/g, '').slice(-10)}`,
      TWILIO_WHATSAPP_FROM || '',
      body
    );
  } catch {
    results.whatsapp = 'failed';
  }

  try {
    results.sms = await sendTwilio(
      `+91${owner.phone.replace(/\D/g, '').slice(-10)}`,
      TWILIO_SMS_FROM || '',
      body
    );
  } catch {
    results.sms = 'failed';
  }

  if (RESEND_API_KEY && EMAIL_FROM) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: EMAIL_FROM,
          to: owner.email,
          subject: `Callback request #${request.requestNumber}`,
          text: body
        })
      });
      results.email = response.ok ? 'sent' : `failed_${response.status}`;
    } catch {
      results.email = 'failed';
    }
  }

  if (ORDER_WEBHOOK_URL) {
    try {
      const response = await fetch(ORDER_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...request, summary: body })
      });
      results.webhook = response.ok ? 'sent' : `failed_${response.status}`;
    } catch {
      results.webhook = 'failed';
    }
  }

  return results;
}
import {
  EMAIL_FROM,
  ORDER_WEBHOOK_URL,
  RESEND_API_KEY,
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_SMS_FROM,
  TWILIO_WHATSAPP_FROM
} from '$app/env/private';
