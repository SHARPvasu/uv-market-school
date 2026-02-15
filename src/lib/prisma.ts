import { PrismaClient } from '@/generated/prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaLibSql } from '@prisma/adapter-libsql';

import path from 'path';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prismaClientSingleton = () => {
  // Check for Turso/LibSQL env vars
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;

  if (tursoUrl && tursoUrl.startsWith('libsql://')) {
    console.log('[PRISMA] Initializing Prisma Client with Adapter (LibSQL/Turso)...');
    const adapter = new PrismaLibSql({
      url: tursoUrl,
      authToken: tursoAuthToken,
    });
    return new PrismaClient({ adapter });
  }

  // Fallback to local BetterSqlite3 for development
  const dbUrl = process.env.DATABASE_URL || 'file:./dev.db';
  const filename = dbUrl.replace('file:', '').trim();
  // better-sqlite3 needs an absolute path if run from a different CWD (like next.js server)
  const resolvedPath = path.isAbsolute(filename) ? filename : path.join(process.cwd(), filename);

  console.log(`[PRISMA] Initializing Prisma Client with Adapter (BetterSqlite3) for: ${resolvedPath}`);

  // Re-instating direct BetterSqlite3 usage as per previous working state, but cleaner
  const Database = require('better-sqlite3');
  const db = new Database(resolvedPath);
  const sqliteAdapter = new PrismaBetterSqlite3(db);

  return new PrismaClient({ adapter: sqliteAdapter });
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
