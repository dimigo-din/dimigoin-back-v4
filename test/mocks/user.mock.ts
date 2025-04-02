import { JwtService } from "@nestjs/jwt";

import { AdminUserPermission, StudentUserPermission } from "../../src/common/mapper/permissions";
import { numberPermission } from "../../src/common/utils/permission.util";
import { UserManageService } from "../../src/routes/user/providers";
import { User } from "../../src/schemas";
import { getApp } from "../app.e2e";
import { UserMock } from "../types";

export const StudentUserMock = (async (): Promise<UserMock> => {
  const target = new User();
  target.email = "student@dimigo.in";
  target.grade = 1;
  target.class = 1;
  target.number = 1;
  target.gcn = "1101";
  target.gender = "male";
  target.name = "student";
  target.card_barcode = "student";
  target.permission = numberPermission(...StudentUserPermission).toString();

  const app = await getApp();
  const jwtService = app.get(JwtService);
  const userManageService = app.get(UserManageService);

  const data = {
    user: target,
    jwt: jwtService.sign({ ...target }, { expiresIn: "5h" }),
  };

  return {
    ...data,
    save: async () => {
      return await userManageService.insertUser(target);
    },
  };
})();

export const AdminUserMock = (async (): Promise<UserMock> => {
  const target = new User();
  target.email = "admin@dimigo.in";
  target.gender = "male";
  target.name = "admin";
  target.card_barcode = null;
  target.permission = numberPermission(...AdminUserPermission).toString();

  const app = await getApp();
  const jwtService = app.get(JwtService);
  const userManageService = app.get(UserManageService);

  const data = {
    user: target,
    jwt: jwtService.sign({ ...target }, { expiresIn: "5h" }),
  };

  return {
    ...data,
    save: async () => {
      return await userManageService.insertUser(target);
    },
  };
})();
