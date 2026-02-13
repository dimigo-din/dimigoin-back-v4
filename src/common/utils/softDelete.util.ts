import { isNull, type SQL } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";
import type { DrizzleDB } from "$modules/drizzle.module";

type TableWithDeletedAt = PgTable & {
  deletedAt: PgColumn;
};

export async function softDelete<T extends TableWithDeletedAt>(
  db: DrizzleDB,
  table: T,
  condition: SQL,
) {
  // biome-ignore lint/suspicious/noExplicitAny: Drizzle DB requires dynamic access for update
  return await (db as any)
    .update(table)
    .set({ deletedAt: new Date() })
    .where(condition)
    .returning();
}

export async function softRestore<T extends TableWithDeletedAt>(
  db: DrizzleDB,
  table: T,
  condition: SQL,
) {
  // biome-ignore lint/suspicious/noExplicitAny: Drizzle DB requires dynamic access for update
  return await (db as any).update(table).set({ deletedAt: null }).where(condition).returning();
}

export function notDeleted<T extends TableWithDeletedAt>(table: T): SQL {
  return isNull(table.deletedAt);
}
