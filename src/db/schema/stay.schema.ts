import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { StaySeatMappingValues } from "$mapper/types";
import { user } from "./user.schema";

export const staySeatTargetEnum = pgEnum("stay_seat_target_enum", StaySeatMappingValues);

export const staySeatPreset = pgTable("stay_seat_preset", {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar().notNull(),
  only_readingRoom: boolean("only_readingRoom").notNull(),
});

export const staySeatPresetRange = pgTable("stay_seat_preset_range", {
  id: uuid().primaryKey().defaultRandom(),
  target: staySeatTargetEnum().notNull(),
  range: varchar().notNull(),
  staySeatPresetId: uuid("staySeatPresetId")
    .notNull()
    .references(() => staySeatPreset.id, {
      onUpdate: "cascade",
      onDelete: "cascade",
    }),
});

export const staySchedule = pgTable("stay_schedule", {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar().notNull().unique(),
  stay_from: integer("stay_from").notNull(),
  stay_to: integer("stay_to").notNull(),
  outing_day: integer("outing_day").array().notNull(),
  created_at: timestamp("created_at", { mode: "date", precision: 6 }).defaultNow().notNull(),
  staySeatPresetId: uuid("staySeatPresetId").references(() => staySeatPreset.id),
});

export const stay = pgTable(
  "stay",
  {
    id: uuid().primaryKey().defaultRandom(),
    name: varchar().notNull(),
    stay_from: date("stay_from").notNull(),
    stay_to: date("stay_to").notNull(),
    outing_day: text("outing_day").array().notNull(),
    staySeatPresetId: uuid("staySeatPresetId").references(() => staySeatPreset.id, {
      onUpdate: "cascade",
    }),
    parentId: uuid("parentId").references(() => staySchedule.id),
    deletedAt: timestamp("deletedAt", { mode: "date" }),
  },
  (t) => [
    index("IDX_stay_from_to").on(t.stay_from, t.stay_to),
    uniqueIndex("UQ_stay_name_from_to").on(t.name, t.stay_from, t.stay_to),
  ],
);

export const stayApplyPeriodStaySchedule = pgTable("stay_apply_period_stay_schedule", {
  id: uuid().primaryKey().defaultRandom(),
  grade: integer().notNull(),
  apply_start_day: integer("apply_start_day").notNull(),
  apply_start_hour: integer("apply_start_hour").notNull(),
  apply_end_day: integer("apply_end_day").notNull(),
  apply_end_hour: integer("apply_end_hour").notNull(),
  stayScheduleId: uuid("stayScheduleId")
    .notNull()
    .references(() => staySchedule.id, {
      onUpdate: "cascade",
      onDelete: "cascade",
    }),
});

export const stayApplyPeriodStay = pgTable(
  "stay_apply_period_stay",
  {
    id: uuid().primaryKey().defaultRandom(),
    grade: integer().notNull(),
    apply_start: timestamp("apply_start", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
    apply_end: timestamp("apply_end", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
    stayId: uuid("stayId").references(() => stay.id, {
      onUpdate: "cascade",
      onDelete: "cascade",
    }),
  },
  (t) => [uniqueIndex("UQ_stay_apply_period_stay_grade").on(t.stayId, t.grade)],
);

export const stayApply = pgTable(
  "stay_apply",
  {
    id: uuid().primaryKey().defaultRandom(),
    stay_seat: varchar("stay_seat").notNull(),
    stayId: uuid("stayId")
      .notNull()
      .references(() => stay.id, { onUpdate: "cascade", onDelete: "cascade" }),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id, {
        onUpdate: "cascade",
        onDelete: "cascade",
      }),
    deletedAt: timestamp("deletedAt", { mode: "date" }),
  },
  (t) => [uniqueIndex("UQ_stay_apply_stay_user").on(t.stayId, t.userId)],
);

export const stayOuting = pgTable("stay_outing", {
  id: uuid().primaryKey().defaultRandom(),
  reason: varchar().notNull(),
  breakfast_cancel: boolean("breakfast_cancel").notNull(),
  lunch_cancel: boolean("lunch_cancel").notNull(),
  dinner_cancel: boolean("dinner_cancel").notNull(),
  from: varchar().notNull(),
  to: varchar().notNull(),
  approved: boolean(),
  audit_reason: varchar("audit_reason"),
  stayApplyId: uuid("stayApplyId")
    .notNull()
    .references(() => stayApply.id, {
      onUpdate: "cascade",
      onDelete: "cascade",
    }),
  deletedAt: timestamp("deletedAt", { mode: "date" }),
});
