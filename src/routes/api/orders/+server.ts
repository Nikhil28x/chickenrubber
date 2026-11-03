import { json } from '@sveltejs/kit';
import { randomUUID } from 'node:crypto';
import { dbQuery } from '../../../lib/server/db';
import { notifyOwner } from '../../../lib/server/notifications';
import type { RequestHandler } from './$types';

// Callback requests: we store who to call and what they are interested in.
// No payment is taken online; the team calls the customer back.
export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const text = (name: string, max = 200) =>
      String(body[name] ?? '')
        .trim()
        .slice(0, max);

    const customerName = text('customer_name', 120);
    if (!customerName) return json({ error: 'Please enter your name' }, { status: 400 });

    const phone = text('mobile_primary').replace(/\D/g, '').slice(-10);
    if (phone.length !== 10)
      return json({ error: 'Enter a valid 10-digit mobile number' }, { status: 400 });

    const city = text('city', 120);
    if (!city) return json({ error: 'Please enter your town or city' }, { status: 400 });

    const pincode = text('pincode', 6);
    if (pincode && !/^\d{6}$/.test(pincode)) {
      return json({ error: 'Enter a valid 6-digit PIN code' }, { status: 400 });
    }

    let items: { id: number; name: string; price: number; quantity: number }[] = [];
    const productId = Number(body.product_id);
    if (Number.isInteger(productId) && productId > 0) {
      const product = await dbQuery<{ id: number; name: string; price: number }>(
        'SELECT id, name, price::float8 AS price FROM products WHERE is_active = TRUE AND id = $1',
        [productId]
      );
      if (product.rows[0]) items = [{ ...product.rows[0], quantity: 1 }];
    }

    const secondary = text('mobile_secondary').replace(/\D/g, '').slice(-10);
    const message = text('message', 1000);
    const shopName = text('shop_name', 120);
    const state = text('state', 80);
    const road = text('road', 200);
    const district = text('district', 80);
    const landmark = text('landmark', 200);
    const id = randomUUID();

    const order = await dbQuery<{ order_number: string }>(
      `INSERT INTO orders (
        id, customer_name, mobile_primary, mobile_secondary, pincode, state, district, city,
        locality, road, landmark, shop_name, payment_method, items, total, message
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'',$9,$10,$11,'callback',$12::jsonb,0,$13)
      RETURNING order_number::text`,
      [
        id,
        customerName,
        phone,
        secondary,
        pincode,
        state,
        district,
        city,
        road,
        landmark,
        shopName,
        JSON.stringify(items),
        message
      ]
    );

    const settings = await dbQuery<{ phone: string; whatsapp: string; email: string }>(
      'SELECT phone, whatsapp, email FROM site_settings WHERE id = 1'
    );
    const notifications = await notifyOwner(
      {
        requestNumber: order.rows[0].order_number,
        customerName,
        mobile: phone,
        location: [shopName, road, landmark && `near ${landmark}`, city, district, state, pincode]
          .filter(Boolean)
          .join(', '),
        product: items[0]?.name ?? 'Not specified',
        message
      },
      settings.rows[0]
    );
    await dbQuery('UPDATE orders SET notifications = $1::jsonb WHERE id = $2', [
      JSON.stringify(notifications),
      id
    ]);

    return json({ ok: true, requestNumber: order.rows[0].order_number });
  } catch (error) {
    console.error('Callback request failed', error);
    return json(
      { error: 'Could not send your request. Please call or WhatsApp us instead.' },
      { status: 500 }
    );
  }
};
