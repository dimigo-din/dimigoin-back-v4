import dataSource from "./data-source";

(async () => {
  await dataSource.initialize();

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();

  await queryRunner.query("SET session_replication_role = 'replica';");

  const tables = dataSource.entityMetadatas.map((entity) => `"${entity.tableName}"`);

  for (const table of tables) {
    await queryRunner.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE;`);
  }

  await queryRunner.query("SET session_replication_role = 'origin';");

  await queryRunner.release();
  await dataSource.destroy();
})();
