import { json } from '@sveltejs/kit';
import { randomUUID } from 'node:crypto';
import { dbQuery } from '../../../lib/server/db';
import { notifyOwner } from '../../../lib/server/notifications';
import type { RequestHandler } from './$types';

type IncomingItem = { id: number; quantity: number };

const requiredFields = [
  'customer_name',
  'mobile_primary',
  'pincode',
  'state',
  'district',
  'city',
  'locality'
] as const;

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();

    for (const field of requiredFields) {
      if (!String(body[field] || '').trim()) {
        return json({ error: `Please enter ${field.replaceAll('_', ' ')}` }, { status: 400 });
      }
    }

    const phone = String(body.mobile_primary).replace(/\D/g, '');
    if (phone.length !== 10)
      return json({ error: 'Enter a valid 10-digit mobile number' }, { status: 400 });
    if (!/^\d{6}$/.test(String(body.pincode))) {
      return json({ error: 'Enter a valid 6-digit PIN code' }, { status: 400 });
    }
    if (!['cod', 'upi'].includes(body.payment_method)) {
      return json({ error: 'Choose a payment method' }, { status: 400 });
    }

    const incoming: IncomingItem[] = Array.isArray(body.items) ? body.items : [];
    const wanted = incoming
      .map((item) => ({
        id: Number(item.id),
        quantity: Math.max(0, Math.min(99, Number(item.quantity)))
      }))
      .filter(
        (item) => Number.isInteger(item.id) && Number.isInteger(item.quantity) && item.quantity > 0
      );
    if (!wanted.length) return json({ error: 'Choose at least one product' }, { status: 400 });

    const productResult = await dbQuery<{
      id: number;
      name: string;
      price: number;
      stock: number;
    }>(
      'SELECT id, name, price::float8 AS price, stock FROM products WHERE is_active = TRUE AND id = ANY($1::int[])',
      [wanted.map((item) => item.id)]
    );

    const items = wanted.map((wantedItem) => {
      const product = productResult.rows.find((row) => row.id === wantedItem.id);
      if (!product) throw new Error('A selected product is no longer available');
      if (wantedItem.quantity > product.stock)
        throw new Error(`${product.name} has only ${product.stock} available`);
      return {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: wantedItem.quantity
      };
    });
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const id = randomUUID();

    const order = await dbQuery<{ order_number: string }>(
      `INSERT INTO orders (
        id, customer_name, mobile_primary, mobile_secondary, pincode, state, district, city,
        locality, road, landmark, shop_name, payment_method, items, total
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14::jsonb,$15)
      RETURNING order_number::text`,
      [
        id,
        String(body.customer_name).trim(),
        phone,
        String(body.mobile_secondary || '').replace(/\D/g, ''),
        String(body.pincode).trim(),
        String(body.state).trim(),
        String(body.district).trim(),
        String(body.city).trim(),
        String(body.locality).trim(),
        String(body.road || '').trim(),
        String(body.landmark || '').trim(),
        String(body.shop_name || '').trim(),
        body.payment_method,
        JSON.stringify(items),
        total
      ]
    );

    for (const item of items) {
      await dbQuery(
        'UPDATE products SET stock = GREATEST(0, stock - $1), updated_at = NOW() WHERE id = $2',
        [item.quantity, item.id]
      );
    }

    const settings = await dbQuery<{ phone: string; whatsapp: string; email: string }>(
      'SELECT phone, whatsapp, email FROM site_settings WHERE id = 1'
    );
    const address = [
      body.shop_name,
      body.locality,
      body.road,
      body.landmark,
      body.city,
      body.district,
      body.state,
      body.pincode
    ]
      .filter(Boolean)
      .join(', ');
    const notifications = await notifyOwner(
      {
        orderNumber: order.rows[0].order_number,
        customerName: String(body.customer_name).trim(),
        mobile: phone,
        address,
        payment: body.payment_method,
        total
      },
      settings.rows[0]
    );
    await dbQuery('UPDATE orders SET notifications = $1::jsonb WHERE id = $2', [
      JSON.stringify(notifications),
      id
    ]);

    return json({ ok: true, orderNumber: order.rows[0].order_number, total });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not place your order';
    console.error('Order failed', error);
    return json({ error: message }, { status: 500 });
  }
};
