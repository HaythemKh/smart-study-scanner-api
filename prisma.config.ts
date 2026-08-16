// Prisma 7 Configuration
// Learn more: https://pris.ly/d/prisma7-config
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Direct URL for migrations
    url: process.env['DIRECT_URL'],
  },
});
