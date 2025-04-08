import { Injectable, Logger, Module } from "@nestjs/common";
import { InjectRepository, TypeOrmModule } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { PermissionValidator, Session, User } from "../../schemas";
import {
  NumberedPermissionGroupsEnum,
  PermissionEnum,
  PermissionType,
} from "../mapper/permissions";
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
      [K in PermissionType]: number;
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
      .filter((u) => Object.values(deprecatedPermissionGroups).some((dpg) => dpg === u.permission))
      .map((u) => {
        const groupName = Object.entries(deprecatedPermissionGroups).find(
          (v) => v[1] === u.permission,
        )[0];
        u.permission = NumberedPermissionGroupsEnum[groupName].toString();
        return u;
      });

    this.logger.log(`OK. ${groupUsers.length} users affected`);

    users = users.filter(
      (u) => !Object.values(deprecatedPermissionGroups).some((dpg) => dpg === u.permission),
    );

    this.logger.log("Individual Permission migration: ");

    const exceptions = [];
    users = users.map((user) => {
      const permissions = parsePermission(parseInt(user.permission), fixedPermissionMappings);

      const newPermissions = [];
      permissions.forEach((permission) => {
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
      permission.value = PermissionEnum[K];
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
}

@Module({
  imports: [TypeOrmModule.forFeature([User, Session, PermissionValidator])],
  providers: [ValidationService],
  exports: [ValidationService],
})
export class ValidationModule {}
