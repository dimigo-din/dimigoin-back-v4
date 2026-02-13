import { SQL } from "bun";

const client = new SQL({
  hostname: Bun.env.DB_HOST,
  port: Number(Bun.env.DB_PORT),
  username: Bun.env.DB_USER,
  password: Bun.env.DB_PASS,
  database: Bun.env.DB_NAME,
});

(async () => {
  try {
    await client("SET session_replication_role = 'replica';");

    const { rows } = await client("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");

    for (const row of rows) {
      await client(`TRUNCATE TABLE "${row.tablename}" RESTART IDENTITY CASCADE;`);
    }

    await client("SET session_replication_role = 'origin';");
  } finally {
    await client.close();
  }
})();
