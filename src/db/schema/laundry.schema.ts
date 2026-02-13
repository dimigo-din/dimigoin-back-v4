import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { GenderValues, LaundryMachineTypeValues } from "$mapper/types";
import { user } from "./user.schema";

export const laundryMachineTypeEnum = pgEnum("laundry_machine_type_enum", LaundryMachineTypeValues);

export const laundryTimeline = pgTable(
  "laundry_timeline",
  {
    id: uuid().primaryKey().defaultRandom(),
    name: varchar().notNull().unique(),
    scheduler: varchar(),
    enabled: boolean().notNull().default(false),
  },
  (t) => [index("UQ_laundrytimeline_scheduler_not_etc").on(t.scheduler)],
);

export const laundryTime = pgTable("laundry_time", {
  id: uuid().primaryKey().defaultRandom(),
  time: varchar().notNull(),
  grade: integer().array().notNull(),
  timelineId: uuid("timelineId")
    .notNull()
    .references(() => laundryTimeline.id, {
      onUpdate: "cascade",
      onDelete: "cascade",
    }),
});

export const genderEnum = pgEnum("gender_enum", GenderValues);

export const laundryMachine = pgTable(
  "laundry_machine",
  {
    id: uuid().primaryKey().defaultRandom(),
    type: laundryMachineTypeEnum().notNull(),
    name: varchar().notNull(),
    gender: genderEnum().notNull(),
    enabled: boolean().notNull(),
  },
  (t) => [uniqueIndex("UQ_laundry_machine_type_name").on(t.type, t.name)],
);

// ManyToMany join table: LaundryTime <-> LaundryMachine
export const laundryTimeToMachine = pgTable(
  "laundry_machine_laundry_time_laundry_time",
  {
    laundryMachineId: uuid("laundryMachineId")
      .notNull()
      .references(() => laundryMachine.id, {
        onUpdate: "cascade",
        onDelete: "cascade",
      }),
    laundryTimeId: uuid("laundryTimeId")
      .notNull()
      .references(() => laundryTime.id, {
        onDelete: "cascade",
      }),
  },
  (t) => [index("IDX_laundry_time_machine").on(t.laundryMachineId, t.laundryTimeId)],
);

export const laundryApply = pgTable(
  "laundry_apply",
  {
    id: uuid().primaryKey().defaultRandom(),
    date: date().notNull(),
    laundryTimelineId: uuid("laundryTimelineId")
      .notNull()
      .references(() => laundryTimeline.id, {
        onUpdate: "cascade",
        onDelete: "cascade",
      }),
    laundryTimeId: uuid("laundryTimeId")
      .notNull()
      .references(() => laundryTime.id, {
        onUpdate: "cascade",
        onDelete: "cascade",
      }),
    laundryMachineId: uuid("laundryMachineId")
      .notNull()
      .references(() => laundryMachine.id, {
        onUpdate: "cascade",
        onDelete: "cascade",
      }),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id, {
        onUpdate: "cascade",
        onDelete: "cascade",
      }),
    created_at: timestamp("created_at", { mode: "date", precision: 6 }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("UQ_laundry_apply_date_time_machine").on(
      t.date,
      t.laundryTimeId,
      t.laundryMachineId,
    ),
  ],
);
