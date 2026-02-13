import { pgEnum, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { PushNotificationSubjectIdentifierValues } from "$mapper/types";
import { user } from "./user.schema";

export const pushSubjectIdentifierEnum = pgEnum(
  "push_subject_identifier_enum",
  PushNotificationSubjectIdentifierValues as unknown as readonly [string, ...string[]],
);

export const pushSubscription = pgTable("push_subscription", {
  id: uuid().primaryKey().defaultRandom(),
  token: varchar().notNull(),
  deviceId: varchar("deviceId"),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date" })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const pushSubject = pgTable("push_subject", {
  id: uuid().primaryKey().defaultRandom(),
  identifier: pushSubjectIdentifierEnum().notNull(),
  name: varchar().notNull(),
  subscriptionId: uuid("subscriptionId")
    .notNull()
    .references(() => pushSubscription.id, {
      onUpdate: "cascade",
      onDelete: "cascade",
    }),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});
