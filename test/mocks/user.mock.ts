import { JwtService } from "@nestjs/jwt";

import { AdminUserPermission, StudentUserPermission } from "../../src/common/mapper/permissions";
import { numberPermission } from "../../src/common/utils/permission.util";
import { User } from "../../src/schemas";
import { PersonalInformationSchema } from "../../src/schemas/personal-information.schema";
import dataSource from "../../src/scripts/data-source";
import { getApp } from "../app.e2e";
import { UserMock } from "../types";

export const StudentUserMock = async (): Promise<UserMock> => {
  const target = new User();
  target.email = "student@dimigo.in";
  target.name = "student";
  target.permission = numberPermission(...StudentUserPermission).toString();

  const personalInformation = new PersonalInformationSchema();
  personalInformation.email = target.email;
  personalInformation.grade = 1;
  personalInformation.class = 1;
  personalInformation.number = 1;
  personalInformation.hakbun = "1101";
  personalInformation.gender = "male";

  const app = await getApp();
  const jwtService = app.get(JwtService);

  const data = {
    user: { ...personalInformation, ...target },
    jwt: jwtService.sign({ ...personalInformation, ...target }, { expiresIn: "5h" }),
  };

  let dbUser = null;

  return {
    ...data,
    save: async (): Promise<UserMock> => {
      await dataSource.initialize();

      const queryRunner = dataSource.createQueryRunner();
      await queryRunner.connect();

      const entityManager = dataSource.createEntityManager(queryRunner);
      const user = await entityManager.save(target);
      await entityManager.save(personalInformation);
      await queryRunner.release();
      await dataSource.destroy();

      dbUser = user;

      return {
        user: { ...personalInformation, ...user },
        jwt: jwtService.sign({ ...personalInformation, ...user }, { expiresIn: "5h" }),
        save: null,
        delete: async () => {
          await dataSource.initialize();
          const queryRunner = dataSource.createQueryRunner();
          await queryRunner.connect();
          const entityManager = dataSource.createEntityManager(queryRunner);

          const data = await entityManager.remove(User, dbUser);

          await queryRunner.release();
          await dataSource.destroy();

          return data;
        },
      };
    },
    delete: null,
  };
};

export const AdminUserMock = async (): Promise<UserMock> => {
  const target = new User();
  target.email = "admin@dimigo.in";
  target.name = "admin";
  target.permission = numberPermission(...AdminUserPermission).toString();

  const app = await getApp();
  const jwtService = app.get(JwtService);

  const data = {
    user: target,
    jwt: jwtService.sign({ ...target }, { expiresIn: "5h" }),
  };

  let dbUser = null;

  return {
    ...data,
    save: async (): Promise<UserMock> => {
      await dataSource.initialize();

      const queryRunner = dataSource.createQueryRunner();
      await queryRunner.connect();

      const entityManager = dataSource.createEntityManager(queryRunner);
      const user = await entityManager.save(target);

      await queryRunner.release();
      await dataSource.destroy();

      dbUser = user;

      return {
        user: user,
        jwt: data.jwt,
        save: null,
        delete: async () => {
          await dataSource.initialize();
          const queryRunner = dataSource.createQueryRunner();
          await queryRunner.connect();
          const entityManager = dataSource.createEntityManager(queryRunner);

          const data = await entityManager.remove(User, dbUser);

          await queryRunner.release();
          await dataSource.destroy();

          return data;
        },
      };
    },
    delete: null,
  };
};
