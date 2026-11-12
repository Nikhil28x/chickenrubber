// Cloudflare's runtime module (the SvelteKit adapter provides it in local dev too).
declare module 'cloudflare:workers' {
  export const env: Record<string, unknown>;
  export function waitUntil(promise: Promise<unknown>): void;
}
