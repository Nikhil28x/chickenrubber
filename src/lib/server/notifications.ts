type NotificationOrder = {
  orderNumber: string;
  customerName: string;
  mobile: string;
  address: string;
  payment: string;
  total: number;
};

function message(order: NotificationOrder) {
  return [
    `New order #${order.orderNumber}`,
    `Customer: ${order.customerName}`,
    `Mobile: ${order.mobile}`,
    `Address: ${order.address}`,
    `Payment: ${order.payment.toUpperCase()}`,
    `Total: ₹${order.total.toFixed(2)}`
  ].join('\n');
}

async function sendTwilio(to: string, from: string, body: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
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
  order: NotificationOrder,
  owner: { phone: string; whatsapp: string; email: string }
) {
  const body = message(order);
  const results: Record<string, string> = {
    whatsapp: 'not_configured',
    sms: 'not_configured',
    email: 'not_configured',
    webhook: 'not_configured'
  };

  try {
    results.whatsapp = await sendTwilio(
      `whatsapp:+91${owner.whatsapp.replace(/\D/g, '').slice(-10)}`,
      process.env.TWILIO_WHATSAPP_FROM || '',
      body
    );
  } catch {
    results.whatsapp = 'failed';
  }

  try {
    results.sms = await sendTwilio(
      `+91${owner.phone.replace(/\D/g, '').slice(-10)}`,
      process.env.TWILIO_SMS_FROM || '',
      body
    );
  } catch {
    results.sms = 'failed';
  }

  if (process.env.RESEND_API_KEY && process.env.EMAIL_FROM) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM,
          to: owner.email,
          subject: `New order #${order.orderNumber}`,
          text: body
        })
      });
      results.email = response.ok ? 'sent' : `failed_${response.status}`;
    } catch {
      results.email = 'failed';
    }
  }

  if (process.env.ORDER_WEBHOOK_URL) {
    try {
      const response = await fetch(process.env.ORDER_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...order, message: body })
      });
      results.webhook = response.ok ? 'sent' : `failed_${response.status}`;
    } catch {
      results.webhook = 'failed';
    }
  }

  return results;
}
