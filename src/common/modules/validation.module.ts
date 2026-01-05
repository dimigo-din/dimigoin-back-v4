import { Injectable, Logger, Module } from "@nestjs/common";
import { InjectRepository, TypeOrmModule } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { PermissionValidator, Session, User } from "../../schemas";
import { LaundrySchedulePriority } from "../mapper/constants";
import {
  NumberedPermissionGroupsEnum,
  PermissionEnum,
  PermissionType,
} from "../mapper/permissions";
import { LaundryTimelineSchedulerValues } from "../mapper/types";
import { deepObjectCompare } from "../utils/compare.util";
import { numberPermission, parsePermission } from "../utils/permission.util";

@Injectable()
export class ValidationService {
  private logger = new Logger(ValidationModule.name);

  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(PermissionValidator)
    private readonly permissionValidatorRepository: Repository<PermissionValidator>,
  ) {}

  async validatePermissionEnum() {
    const savedPermissionMappings = await this.permissionValidatorRepository.find();

    const fixedPermissionMappings = Object.fromEntries(
      savedPermissionMappings
        .filter((v) => v.type === "permission")
        .sort()
        .map((v) => [v.key, parseInt(v.value as unknown as string)]),
    ) as {
      [K in PermissionType]: number;
    };
    const fixedPermissionGroupMappings = Object.fromEntries(
      savedPermissionMappings
        .filter((v) => v.type === "permission_group")
        .sort()
        .map((v) => [v.key, parseInt(v.value as unknown as string)]),
    ) as {
      [key: string]: number;
    };

    if (
      deepObjectCompare(PermissionEnum, fixedPermissionMappings) &&
      deepObjectCompare(NumberedPermissionGroupsEnum, fixedPermissionGroupMappings)
    ) {
      this.logger.log("Permission validation successful - no changes");
      return;
    }

    this.logger.warn("Permission validation failed - changes detected.");
    this.logger.warn("Trying auto migration...");

    let users = await this.userRepository.find();

    this.logger.log("Permission Group migration:");

    const deprecatedPermissionGroups = Object.fromEntries(
      Object.keys(NumberedPermissionGroupsEnum).map((v) => [v, fixedPermissionGroupMappings[v]]),
    );
    const groupUsers = users
      .filter((u) =>
        Object.values(deprecatedPermissionGroups).some((dpg) => dpg.toString() === u.permission),
      )
      .map((u) => {
        users.splice(users.indexOf(u), 1);
        const groupName = Object.entries(deprecatedPermissionGroups).find(
          (v) => v[1].toString() === u.permission,
        )[0];
        u.permission = NumberedPermissionGroupsEnum[groupName].toString();
        return u;
      });

    this.logger.log(`OK. ${groupUsers.length} users affected`);

    this.logger.log("Individual Permission migration: ");

    const exceptions: User[] = [];
    users = users.map((user) => {
      const permissions = parsePermission(parseInt(user.permission), fixedPermissionMappings);

      const newPermissions: number[] = [];
      permissions.forEach((permission) => {
        if (exceptions.includes(user)) return;
        if (!PermissionEnum[permission]) {
          exceptions.push(user);
          return;
        }
        newPermissions.push(PermissionEnum[permission]);
      });

      user.permission = numberPermission(...newPermissions).toString();
      return user;
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

    users = [].concat(groupUsers, users);
    await this.userRepository.save(users);

    await this.permissionValidatorRepository.clear();

    const permissions: PermissionValidator[] = [];
    Object.keys(PermissionEnum).forEach((K) => {
      const permission = new PermissionValidator();
      permission.type = "permission";
      permission.key = K;
      permission.value = PermissionEnum[K as PermissionType].toString();
      permissions.push(permission);
    });
    Object.keys(NumberedPermissionGroupsEnum).forEach((pg) => {
      const permissionGroup = new PermissionValidator();
      permissionGroup.type = "permission_group";
      permissionGroup.key = pg;
      permissionGroup.value = NumberedPermissionGroupsEnum[pg].toString();
      permissions.push(permissionGroup);
    });

    await this.permissionValidatorRepository.save(permissions);

    this.logger.log("OK. All changes have been commited");
  }

  async validateSession() {
    this.logger.log("Clearing expired sessions:");
    // await this.sessionRepository.clear();
    // this.logger.log("OK. Sessions cleared");
    this.logger.log("NOP");
  }

  async validateLaundrySchedulePriority() {
    for (let schedule of LaundryTimelineSchedulerValues) {
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
  imports: [TypeOrmModule.forFeature([User, Session, PermissionValidator])],
  providers: [ValidationService],
  exports: [ValidationService],
})
export class ValidationModule {}
