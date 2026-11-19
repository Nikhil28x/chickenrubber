import type pg from 'pg';

declare global {
  namespace App {
    interface Locals {
      admin: boolean;
      // This request's database connections (see lib/server/db.ts).
      db?: pg.Pool;
    }
    interface PageState {
      // Set while the full-screen photo viewer is open, so Back closes it.
      viewer?: boolean;
    }
  }
}

export {};
