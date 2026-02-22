import { index, integer, pgTable, uuid, varchar } from "drizzle-orm/pg-core";
import { ClassValues, GenderValues, GradeValues } from "$mapper/types";

export const user = pgTable(
  "user",
  {
    id: uuid().primaryKey().defaultRandom(),
    email: varchar().notNull().unique(),
    name: varchar().notNull(),
    picture: varchar().notNull(),
    grade: integer().$type<(typeof GradeValues)[number]>(),
    class: integer().$type<(typeof ClassValues)[number]>(),
    gender: varchar({ enum: GenderValues }),
    permission: varchar().notNull().default("0"),
  },
  (t) => [index("IDX_user_email").on(t.email)],
);
