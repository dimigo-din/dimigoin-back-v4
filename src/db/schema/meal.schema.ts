import {
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const mealTimeline = pgTable(
  "meal_timeline",
  {
    id: uuid().primaryKey().defaultRandom(),
    start: date().notNull(),
    end: date().notNull(),
    created_at: timestamp("created_at", { mode: "date", precision: 6 }).defaultNow().notNull(),
  },
  (t) => [index("IDX_meal_timeline_start_end").on(t.start, t.end)],
);

export const mealTimelineSlot = pgTable(
  "meal_timeline_slot",
  {
    id: uuid().primaryKey().defaultRandom(),
    grade: integer().notNull(), // 1, 2, 3
    time: varchar().notNull(),
    classes: integer().array().notNull(),
    timelineId: uuid("timelineId")
      .notNull()
      .references(() => mealTimeline.id, {
        onUpdate: "cascade",
        onDelete: "cascade",
      }),
  },
  (t) => [index("IDX_meal_slot_timeline_grade").on(t.timelineId, t.grade)],
);

export const mealTimelineDelay = pgTable("meal_timeline_delay", {
  id: uuid().primaryKey().defaultRandom(),
  date: date().notNull(),
  source: varchar().notNull(),
  dest: varchar().notNull(),
  description: varchar().notNull(),
  timelineId: uuid("timelineId")
    .notNull()
    .references(() => mealTimeline.id, {
      onUpdate: "cascade",
      onDelete: "cascade",
    }),
  created_at: timestamp("created_at", { mode: "date", precision: 6 }).defaultNow().notNull(),
});

export const mealTypeValues = ["breakfast", "lunch", "dinner"] as const;
export const mealTypeEnum = pgEnum("meal_type_enum", mealTypeValues);

export const meal = pgTable(
  "meal",
  {
    id: uuid().primaryKey().defaultRandom(),
    date: date().notNull(),
    type: mealTypeEnum().notNull(),
    regular: text().array().notNull(),
    simple: text().array().notNull().default([]),
    image: varchar(),
    created_at: timestamp("created_at", { mode: "date", precision: 6 }).defaultNow().notNull(),
  },
  (t) => [index("UQ_meal_date_type").on(t.date, t.type)],
);
