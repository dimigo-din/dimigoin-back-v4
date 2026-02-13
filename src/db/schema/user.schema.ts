import { index, pgTable, uuid, varchar } from "drizzle-orm/pg-core";
import { StudentUserPermission } from "$mapper/permissions";
import { numberPermission } from "$utils/permission.util";

export const user = pgTable(
  "user",
  {
    id: uuid().primaryKey().defaultRandom(),
    email: varchar().notNull().unique(),
    name: varchar().notNull(),
    picture: varchar().notNull(),
    permission: varchar()
      .notNull()
      .default(numberPermission(...StudentUserPermission).toString()),
  },
  (t) => [index("IDX_user_email").on(t.email)],
);
