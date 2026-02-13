import { boolean, index, integer, pgEnum, pgTable, uuid, varchar } from "drizzle-orm/pg-core";
import { FrigoTimingValues } from "$mapper/types";
import { user } from "./user.schema";

export const frigoTimingEnum = pgEnum("frigo_timing_enum", FrigoTimingValues);

export const frigoApplyPeriod = pgTable("frigo_apply_period", {
  id: uuid().primaryKey().defaultRandom(),
  apply_start_day: integer("apply_start_day").notNull(),
  apply_end_day: integer("apply_end_day").notNull(),
  apply_start_hour: integer("apply_start_hour").notNull(),
  apply_end_hour: integer("apply_end_hour").notNull(),
  grade: integer().notNull().unique(),
});

export const frigoApply = pgTable(
  "frigo_apply",
  {
    id: uuid().primaryKey().defaultRandom(),
    week: varchar().notNull(),
    timing: frigoTimingEnum().notNull(),
    reason: varchar(),
    audit_reason: varchar("audit_reason"),
    approved: boolean(),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id),
  },
  (t) => [index("IDX_frigo_apply_week_user").on(t.week, t.userId)],
);
