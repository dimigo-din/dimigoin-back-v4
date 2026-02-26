import { foreignKey, pgEnum, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { FacilityReportTypeValues } from "$mapper/types";
import { user } from "./user.schema";

export const facilityReportTypeEnum = pgEnum("facility_report_type_enum", FacilityReportTypeValues);

export const facilityReport = pgTable("facility_report", {
  id: uuid().primaryKey().defaultRandom(),
  status: text().notNull().default("Waiting"),
  report_type: facilityReportTypeEnum("report_type").notNull(),
  subject: varchar().notNull(),
  body: varchar().notNull(),
  created_at: timestamp("created_at", { mode: "date", precision: 6 }).defaultNow().notNull(),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id, { onUpdate: "cascade", onDelete: "cascade" }),
});

export const facilityImg = pgTable("facility_img", {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar().notNull(),
  location: varchar().notNull(),
  created_at: timestamp("created_at", { mode: "date", precision: 6 }).defaultNow().notNull(),
  parentId: uuid("parentId")
    .notNull()
    .references(() => facilityReport.id, {
      onUpdate: "cascade",
      onDelete: "cascade",
    }),
});

export const facilityReportComment = pgTable(
  "facility_report_comment",
  {
    id: uuid().primaryKey().defaultRandom(),
    commentParentId: uuid("commentParentId"),
    parentId: uuid("parentId")
      .notNull()
      .references(() => facilityReport.id),
    text: varchar().notNull(),
    created_at: timestamp("created_at", { mode: "date", precision: 6 }).defaultNow().notNull(),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id),
  },
  (table) => ({
    commentParentFk: foreignKey({
      columns: [table.commentParentId],
      foreignColumns: [table.id],
    }),
  }),
);
