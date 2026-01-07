import { DataSource } from "typeorm";

export default new DataSource({
  type: "postgres",
  host: Bun.env.DB_HOST,
  port: Number(Bun.env.DB_PORT),
  username: Bun.env.DB_USER,
  password: Bun.env.DB_PASS,
  database: Bun.env.DB_NAME,
  entities: ["src/schemas/**/*.ts"],
  migrations: ["src/migrations/**/*.ts"],
  synchronize: false,
});
