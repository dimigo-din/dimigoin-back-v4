import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  entities: ['src/schemas/**/*.ts'],
  migrations: ['src/migrations/**/*.ts'],
  synchronize: false,
});
