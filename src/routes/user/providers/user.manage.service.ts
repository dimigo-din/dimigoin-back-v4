import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { eq, like } from "drizzle-orm";
import { login, user } from "#/db/schema";
import { PermissionType } from "$mapper/permissions";
import type { Grade } from "$mapper/types";
import { DRIZZLE, type DrizzleDB } from "$modules/drizzle.module";
import { numberPermission, parsePermission } from "$utils/permission.util";
import {
  AddPermissionDTO,
  CreateUserDTO,
  RemovePermissionDTO,
  SearchUserDTO,
  SetPermissionDTO,
} from "~user/dto";

@Injectable()
export class UserManageService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly configService: ConfigService,
  ) {}

  async searchUser(data: SearchUserDTO) {
    return await this.db
      .select()
      .from(user)
      .where(like(user.name, `%${data.name}%`));
  }

  async checkUserDetail(
    email: string,
    config: { gender?: "male" | "female"; grade?: Grade | string },
  ): Promise<boolean | null> {
    if (config.grade) {
      config.grade = config.grade.toString();
    }
    const baseURL = this.configService.get<string>("PERSONAL_INFORMATION_SERVER");
    const token = this.configService.get<string>("PERSONAL_INFORMATION_TOKEN");
    const res = await Bun.fetch(`${baseURL}/personalInformation/check`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mail: email,
        ...config,
      }),
    });

    if (res.status === 200) {
      return (await res.json()) as boolean;
    }

    if (res.status >= 400 && res.status < 500) {
      return null;
    }

    throw new Error(`Request failed with status ${res.status}`);
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
