import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  url: process.env.DATABASE_URL || 'postgresql://projectflow:projectflow_secret_2024@localhost:5432/projectflow',
  type: 'postgres' as const,
  autoLoadEntities: true,
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
}));
