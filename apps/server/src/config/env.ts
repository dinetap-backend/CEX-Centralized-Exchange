import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

const candidateRoots = [
  process.cwd(),
  path.resolve(process.cwd(), '..'),
  path.resolve(process.cwd(), '../..'),
  path.resolve(process.cwd(), '../../..'),
];

for (const candidateRoot of candidateRoots) {
  const envPath = path.join(candidateRoot, '.env');
  if (fs.existsSync(envPath)) dotenv.config({ path: envPath });
}

dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: Number.parseInt(process.env.PORT ?? '5000', 10),
  MONGODB_URI:
    process.env.MONGODB_URI ?? 'mongodb://localhost:27018/cexexchange?directConnection=true&replicaSet=rs0',
  JWT_SECRET: process.env.JWT_SECRET ?? 'portfolio-dev-secret',
};

export const isProduction = env.NODE_ENV === 'production';
