import { bigint, pgEnum, pgTable, uuid, varchar } from "drizzle-orm/pg-core";
import { PermissionValidationTypeValues } from "$mapper/types";

export const permissionValidationTypeEnum = pgEnum(
  "permission_validation_type_enum",
  PermissionValidationTypeValues,
);

export const permissionValidator = pgTable("permission_validator", {
  id: uuid().primaryKey().defaultRandom(),
  type: permissionValidationTypeEnum().notNull(),
  key: varchar().notNull(),
  value: bigint({ mode: "number" }).notNull(),
});
