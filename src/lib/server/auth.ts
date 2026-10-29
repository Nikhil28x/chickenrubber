import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import {
  ADMIN_PASSWORD,
  ADMIN_SESSION_SECRET,
  ADMIN_USERNAME,
  DATABASE_URL
} from '$app/env/private';

const DEFAULT_PASSWORD_HASH = 'ff7bd97b1a7789ddd2775122fd6817f3173672da9f802ceec57f284325bf589f';

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function passwordHash(password: string) {
  return createHash('sha256').update(password).digest('hex');
}

function secret() {
  return ADMIN_SESSION_SECRET || `${DATABASE_URL || 'raghav'}-session-v1`;
}

export function verifyAdmin(username: string, password: string) {
  const expectedUser = ADMIN_USERNAME || 'admin';
  const expectedPasswordHash = ADMIN_PASSWORD
    ? passwordHash(ADMIN_PASSWORD)
    : DEFAULT_PASSWORD_HASH;

  return (
    safeEqual(username, expectedUser) && safeEqual(passwordHash(password), expectedPasswordHash)
  );
}

export function createAdminToken() {
  const expires = Date.now() + 1000 * 60 * 60 * 12;
  const payload = `admin:${expires}`;
  const signature = createHmac('sha256', secret()).update(payload).digest('hex');
  return `${payload}:${signature}`;
}

export function verifyAdminToken(token: string | undefined) {
  if (!token) return false;
  const [role, expires, signature] = token.split(':');
  if (role !== 'admin' || !expires || !signature || Number(expires) < Date.now()) return false;
  const expected = createHmac('sha256', secret()).update(`${role}:${expires}`).digest('hex');
  return safeEqual(signature, expected);
}
