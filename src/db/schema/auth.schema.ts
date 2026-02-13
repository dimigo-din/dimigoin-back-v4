import { pgEnum, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { LoginTypeValues } from "$mapper/types";
import { user } from "./user.schema";

export const loginTypeEnum = pgEnum("login_type_enum", LoginTypeValues);

export const login = pgTable("login", {
  id: uuid().primaryKey().defaultRandom(),
  type: loginTypeEnum().notNull(),
  identifier1: text().notNull(),
  identifier2: text(),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id, { onUpdate: "cascade", onDelete: "cascade" }),
});

export const session = pgTable("session", {
  id: uuid().primaryKey().defaultRandom(),
  refreshToken: varchar("refreshToken").notNull(),
  sessionIdentifier: varchar("sessionIdentifier").notNull(),
  created_at: timestamp("created_at", { mode: "date", precision: 6 }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { mode: "date", precision: 6 })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id, { onUpdate: "cascade", onDelete: "cascade" }),
});
