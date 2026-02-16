import { Inject, Injectable, Logger, Module } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { permissionValidator, user } from "#/db/schema";
import { LaundrySchedulePriority } from "$mapper/constants";
import { NumberedPermissionGroupsEnum, PermissionEnum, PermissionType } from "$mapper/permissions";
import { LaundryTimelineSchedulerValues } from "$mapper/types";
import { DRIZZLE, type DrizzleDB, DrizzleModule } from "$modules/drizzle.module";
import { numberPermission, parsePermission } from "$utils/permission.util";

@Injectable()
export class ValidationService {
  private logger = new Logger(ValidationModule.name);

  constructor(
    @Inject(DRIZZLE)
    private readonly db: DrizzleDB,
  ) {}

  async validatePermissionEnum() {
    const savedPermissionMappings = await this.db.select().from(permissionValidator);

    const fixedPermissionMappings = Object.fromEntries(
      savedPermissionMappings
        .filter((v) => v.type === "permission")
        .sort()
        .map((v) => [v.key, v.value]),
    ) as {
      [K in PermissionType]: number;
    };
    const fixedPermissionGroupMappings = Object.fromEntries(
      savedPermissionMappings
        .filter((v) => v.type === "permission_group")
        .sort()
        .map((v) => [v.key, v.value]),
    ) as {
      [key: string]: number;
    };

    if (
      Bun.deepEquals(PermissionEnum, fixedPermissionMappings) &&
      Bun.deepEquals(NumberedPermissionGroupsEnum, fixedPermissionGroupMappings)
    ) {
      this.logger.log("Permission validation successful - no changes");
      return;
    }

    this.logger.warn("Permission validation failed - changes detected.");
    this.logger.warn("Trying auto migration...");

    let users = await this.db.select().from(user);

    this.logger.log("Permission Group migration:");

    const deprecatedPermissionGroups = Object.fromEntries(
      Object.keys(NumberedPermissionGroupsEnum).map((v) => [v, fixedPermissionGroupMappings[v]]),
    );

    const exceptions: (typeof users)[number][] = [];

    const groupUsers = users
      .filter((u) =>
        Object.values(deprecatedPermissionGroups).some((dpg) => dpg?.toString() === u.permission),
      )
      .map((u) => {
        users = users.filter((x) => x.id !== u.id);
        const groupName = Object.entries(deprecatedPermissionGroups).find(
          (v) => v[1]?.toString() === u.permission,
        )?.[0];
        if (!groupName) {
          exceptions.push(u);
          return u;
        }
        return {
          ...u,
          permission: NumberedPermissionGroupsEnum[groupName]?.toString() ?? u.permission,
        };
      });

    this.logger.log(`OK. ${groupUsers.length} users affected`);

    this.logger.log("Individual Permission migration: ");

    users = users.map((u) => {
      const permissions = parsePermission(parseInt(u.permission, 10), fixedPermissionMappings);

      const newPermissions: number[] = [];
      permissions.forEach((permission) => {
        if (exceptions.includes(u)) {
          return;
        }
        if (!PermissionEnum[permission]) {
          this.logger.warn(`Deprecated permission "${permission}" dropped for user ${u.id}`);
          return;
        }
        newPermissions.push(PermissionEnum[permission]);
      });

      return { ...u, permission: numberPermission(...newPermissions).toString() };
    });

    if (exceptions.length !== 0) {
      this.logger.error(
        `Failed. ${users.length} affected but ${exceptions.length} users cannot be auto-migrated`,
      );
      this.logger.error(`Details: ${exceptions.map((e) => e.id).join(", ")}`);
      this.logger.error("Changes are not commited.");
      throw new Error("Migration failed");
    }

    this.logger.log(`OK. ${users.length} users affected.`);

    // Commit changes
    this.logger.log("Commiting changes:");

    const allUsers = groupUsers.concat(users);
    for (const u of allUsers) {
      await this.db.update(user).set({ permission: u.permission }).where(eq(user.id, u.id));
    }

    // Clear and re-insert permission validators
    await this.db.delete(permissionValidator);

    const permissionsToInsert: (typeof permissionValidator.$inferInsert)[] = [];
    Object.keys(PermissionEnum).forEach((K) => {
      permissionsToInsert.push({
        type: "permission",
        key: K,
        value: PermissionEnum[K as PermissionType],
      });
    });
    Object.keys(NumberedPermissionGroupsEnum).forEach((pg) => {
      permissionsToInsert.push({
        type: "permission_group",
        key: pg,
        value: NumberedPermissionGroupsEnum[pg] ?? 0,
      });
    });

    await this.db.insert(permissionValidator).values(permissionsToInsert);

    this.logger.log("OK. All changes have been commited");
  }

  async validateSession() {
    this.logger.log("Clearing expired sessions:");
    this.logger.log("NOP");
  }

  async validateLaundrySchedulePriority() {
    for (const schedule of LaundryTimelineSchedulerValues) {
      if (!LaundrySchedulePriority.some((s) => s.schedule === schedule)) {
        throw new Error(
          `There is an unlisted LaundryTimelineScheduler value on LaundrySchedule Priority. ${schedule}`,
        );
      }
    }

    this.logger.log("LaundrySchedule priority validation successful");
  }
}

@Module({
  imports: [DrizzleModule],
  providers: [ValidationService],
  exports: [ValidationService],
})
export class ValidationModule {}
