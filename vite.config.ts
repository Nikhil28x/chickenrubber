import { sveltekit } from '@sveltejs/kit/vite';
import adapter from '@sveltejs/adapter-vercel';
import { defineConfig } from 'vite';

export default defineConfig(async () => ({
  plugins: [await sveltekit({ adapter: adapter({ runtime: 'nodejs24.x' }) })]
}));
