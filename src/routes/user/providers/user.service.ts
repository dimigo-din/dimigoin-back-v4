import { forwardRef, HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import * as bcrypt from "bcrypt";
import merge from "merge-js-class";
import { Repository } from "typeorm";

import { AuthService } from "../../../auth/auth.service";
import { ErrorMsg } from "../../../common/mapper/error";
import {
  CommonUserPermission,
  NumberedPermissionGroupsEnum,
  PermissionEnum,
  PermissionType,
} from "../../../common/mapper/permissions";
import { UserJWT } from "../../../common/mapper/types";
import {
  hasPermission,
  numberPermission,
  parsePermission,
} from "../../../common/utils/permission.util";
import { Login, User } from "../../../schemas";
import {
  AddPermissionDTO,
  CreateUserDTO,
  RemovePermissionDTO,
  SetPermissionDTO,
  SetUserDetailDTO,
} from "../dto";

@Injectable()
export class UserService {
  constructor(
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Login)
    private readonly loginRepository: Repository<Login>,
  ) {}

  async getUserById(id: string): Promise<User> {
    return await this.userRepository.findOne({ where: { id } });
  }

  async isSignUpCompleted(id: string): Promise<boolean> {
    const user = await this.getUserById(id);

    return hasPermission(user.permission, [PermissionEnum.SIGNUP_COMPLETE]);
  }

  async setUserDetail(user: UserJWT, data: SetUserDetailDTO) {
    if (await this.isSignUpCompleted(user.id))
      throw new HttpException(ErrorMsg.ResourceAlreadyExists, HttpStatus.NOT_ACCEPTABLE);
    const dbUser = await this.getUserById(user.id);

    dbUser.grade = data.grade;
    dbUser.class = data.class;
    dbUser.number = data.number;

    await this.userRepository.save(dbUser);
    await this.addPermission({
      id: dbUser.id,
      permissions: ["SIGNUP_COMPLETE"],
    });
    await this.authService.logout(user);
  }

  async createUser(data: CreateUserDTO): Promise<User> {
    const user = new User();
    user.email = data.email;
    user.name = data.name;

    const login = new Login();
    login.type = data.loginType;
    login.identifier1 = data.identifier1;
    login.identifier2 = data.identifier2;
    login.user = user;

    await this.userRepository.save(user);
    await this.loginRepository.save(login);

    return user;
  }

  async deleteUser(id: string): Promise<User> {
    const user = await this.getUserById(id);
    return await this.userRepository.remove(user);
  }

  // this bunch of code can be shortened.
  // but I left it like this for optimization.
  async setPermission(data: SetPermissionDTO) {
    const user = await this.userRepository.findOne({ where: { id: data.id } });
    user.permission = numberPermission(...data.permissions).toString();

    return await this.userRepository.save(user);
  }

  async addPermission(data: AddPermissionDTO) {
    const user = await this.userRepository.findOne({ where: { id: data.id } });

    const permissions = parsePermission(user.permission);

    const addPermissionTarget = data.permissions.filter(
      (p: PermissionType) => !permissions.find((p2) => p2 === p),
    );

    const resultPermission = [].concat(permissions, addPermissionTarget);

    user.permission = numberPermission(...resultPermission).toString();

    return await this.userRepository.save(user);
  }

  async removePermission(data: RemovePermissionDTO) {
    const user = await this.userRepository.findOne({ where: { id: data.id } });

    const resultPermissions = parsePermission(user.permission).filter(
      (p: PermissionType) => !data.permissions.find((p2) => p2 === p),
    ) as PermissionType[];

    user.permission = numberPermission(...resultPermissions).toString();

    return await this.userRepository.save(user);
  }
}
