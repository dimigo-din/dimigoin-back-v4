import { HttpException, HttpStatus, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { eq, like } from "drizzle-orm";
import { login, user } from "#/db/schema";
import { ErrorMsg } from "$mapper/error";
import { PermissionType } from "$mapper/permissions";
import type { Class, Gender, Grade } from "$mapper/types";
import { ClassValues, GenderValues, GradeValues } from "$mapper/types";
import { DRIZZLE, type DrizzleDB } from "$modules/drizzle.module";
import { numberPermission, parsePermission } from "$utils/permission.util";
import {
  AddPermissionDTO,
  CreateUserDTO,
  RemovePermissionDTO,
  SearchUserDTO,
  SetPermissionDTO,
} from "~user/dto";

type UserDetail = {
  grade: Grade;
  class: Class;
  gender: Gender;
};

@Injectable()
export class UserManageService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async searchUser(data: SearchUserDTO) {
    return await this.db
      .select()
      .from(user)
      .where(like(user.name, `%${data.name}%`));
  }

  private toUserDetail(value: typeof user.$inferSelect): UserDetail | null {
    if (
      value.grade === null ||
      value.class === null ||
      value.gender === null ||
      !GradeValues.includes(value.grade) ||
      !ClassValues.includes(value.class) ||
      !GenderValues.includes(value.gender)
    ) {
      return null;
    }

    return {
      grade: value.grade,
      class: value.class,
      gender: value.gender,
    };
  }

  async getUserDetail(userId: string): Promise<UserDetail | null> {
    const dbUser = await this.db.query.user.findFirst({
      where: { RAW: (t, { eq }) => eq(t.id, userId) },
    });

    if (!dbUser) {
      return null;
    }

    return this.toUserDetail(dbUser);
  }

  async getRequiredUserDetail(userId: string): Promise<UserDetail> {
    const dbUser = await this.db.query.user.findFirst({
      where: { RAW: (t, { eq }) => eq(t.id, userId) },
    });

    if (!dbUser) {
      throw new NotFoundException("User not found");
    }

    const detail = this.toUserDetail(dbUser);
    if (!detail) {
      throw new HttpException(ErrorMsg.PersonalInformation_NotRegistered(), HttpStatus.NOT_FOUND);
    }

    return detail;
  }

  async createUser(data: CreateUserDTO): Promise<typeof user.$inferSelect> {
    const [newUser] = await this.db
      .insert(user)
      .values({
        email: data.email,
        name: data.name,
        picture: data.picture,
      })
      .returning();

    if (!newUser) {
      throw new NotFoundException("Failed to create user");
    }

    await this.db.insert(login).values({
      type: data.loginType,
      identifier1: data.identifier1,
      identifier2: data.identifier2,
      userId: newUser.id,
    });

    return newUser;
  }

  async addPasswordLogin(userId: string, password: string) {
    const hashedPassword = await Bun.password.hash(password);

    const dbUser = await this.db.query.user.findFirst({
      where: { RAW: (t, { eq }) => eq(t.id, userId) },
    });
    if (!dbUser) {
      throw new NotFoundException("User not found");
    }

    const [newLogin] = await this.db
      .insert(login)
      .values({
        type: "password",
        identifier1: dbUser.email,
        identifier2: hashedPassword,
        userId: dbUser.id,
      })
      .returning();

    if (!newLogin) {
      throw new NotFoundException("Failed to create login");
    }

    return newLogin;
  }

  async setPermission(data: SetPermissionDTO) {
    const dbUser = await this.db.query.user.findFirst({
      where: { RAW: (t, { eq }) => eq(t.id, data.id) },
    });
    if (!dbUser) {
      throw new NotFoundException("User not found");
    }

    const [updated] = await this.db
      .update(user)
      .set({ permission: numberPermission(...data.permissions).toString() })
      .where(eq(user.id, data.id))
      .returning();

    if (!updated) {
      throw new NotFoundException("Failed to update permission");
    }

    return updated;
  }

  async addPermission(data: AddPermissionDTO) {
    const dbUser = await this.db.query.user.findFirst({
      where: { RAW: (t, { eq }) => eq(t.id, data.id) },
    });
    if (!dbUser) {
      throw new NotFoundException("User not found");
    }

    const permissions = parsePermission(dbUser.permission);

    const addPermissionTarget = data.permissions.filter(
      (p: PermissionType) => !permissions.find((p2) => p2 === p),
    );

    const resultPermission = permissions.concat(addPermissionTarget);

    const [updated] = await this.db
      .update(user)
      .set({ permission: numberPermission(...resultPermission).toString() })
      .where(eq(user.id, data.id))
      .returning();

    if (!updated) {
      throw new NotFoundException("Failed to update permission");
    }

    return updated;
  }

  async removePermission(data: RemovePermissionDTO) {
    const dbUser = await this.db.query.user.findFirst({
      where: { RAW: (t, { eq }) => eq(t.id, data.id) },
    });
    if (!dbUser) {
      throw new NotFoundException("User not found");
    }

    const resultPermissions = parsePermission(dbUser.permission).filter(
      (p: PermissionType) => !data.permissions.find((p2) => p2 === p),
    ) as PermissionType[];

    const [updated] = await this.db
      .update(user)
      .set({ permission: numberPermission(...resultPermissions).toString() })
      .where(eq(user.id, data.id))
      .returning();

    if (!updated) {
      throw new NotFoundException("Failed to update permission");
    }

    return updated;
  }
}
