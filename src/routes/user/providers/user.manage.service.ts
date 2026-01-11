import { Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Like, Repository } from "typeorm";
import { Login, User } from "#/schemas";
import { PermissionType } from "$mapper/permissions";
import type { Grade } from "$mapper/types";
import { numberPermission, parsePermission } from "$utils/permission.util";
import {
  AddPermissionDTO,
  CreateUserDTO,
  RemovePermissionDTO,
  SearchUserDTO,
  SetPermissionDTO,
} from "~user/dto";

// this chuck of code need to be refactored
@Injectable()
export class UserManageService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Login)
    private readonly loginRepository: Repository<Login>,
    private readonly configService: ConfigService,
  ) {}

  // TODO: get from array like fetchUserDetail(...email)
  // async fetchUserDetail(...emails: string[]): Promise<PersonalData[]> {
  //   const data: PersonalData[] = [];
  //
  //   for (const email of emails) {
  //     const personalInformation = await this.personalInformationRepository.findOne({
  //       where: { email: email },
  //     });
  //
  //     if (personalInformation)
  //       data.push({
  //         gender: personalInformation.gender,
  //         grade: personalInformation.grade,
  //         class: personalInformation.class,
  //         number: personalInformation.number,
  //         hakbun: personalInformation.hakbun,
  //       });
  //     else data.push(null);
  //   }
  //
  //   return data;
  // }

  async searchUser(data: SearchUserDTO) {
    const users = await this.userRepository.find({
      where: {
        name: Like(`%${data.name}%`),
      },
    });

    return users;
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

  async createUser(data: CreateUserDTO): Promise<User> {
    const user = new User();
    user.email = data.email;
    user.name = data.name;
    user.picture = data.picture;

    const login = new Login();
    login.type = data.loginType;
    login.identifier1 = data.identifier1;
    login.identifier2 = data.identifier2;
    login.user = user;

    await this.userRepository.save(user);
    await this.loginRepository.save(login);

    return user;
  }

  async addPasswordLogin(user: string, password: string) {
    const hashedPassword = await Bun.password.hash(password);

    const dbUser = await this.userRepository.findOne({ where: { id: user } });
    if (!dbUser) {
      throw new NotFoundException("User not found");
    }

    const login = new Login();
    login.type = "password";
    login.identifier1 = dbUser.email;
    login.identifier2 = hashedPassword;
    login.user = dbUser;

    return await this.loginRepository.save(login);
  }

  // this bunch of code can be shortened.
  // but I left it like this for optimization.
  async setPermission(data: SetPermissionDTO) {
    const user = await this.userRepository.findOne({ where: { id: data.id } });
    if (!user) {
      throw new NotFoundException("User not found");
    }
    user.permission = numberPermission(...data.permissions).toString();

    return await this.userRepository.save(user);
  }

  async addPermission(data: AddPermissionDTO) {
    const user = await this.userRepository.findOne({ where: { id: data.id } });
    if (!user) {
      throw new NotFoundException("User not found");
    }

    const permissions = parsePermission(user.permission);

    const addPermissionTarget = data.permissions.filter(
      (p: PermissionType) => !permissions.find((p2) => p2 === p),
    );

    const resultPermission = permissions.concat(addPermissionTarget);

    user.permission = numberPermission(...resultPermission).toString();

    return await this.userRepository.save(user);
  }

  async removePermission(data: RemovePermissionDTO) {
    const user = await this.userRepository.findOne({ where: { id: data.id } });
    if (!user) {
      throw new NotFoundException("User not found");
    }

    const resultPermissions = parsePermission(user.permission).filter(
      (p: PermissionType) => !data.permissions.find((p2) => p2 === p),
    ) as PermissionType[];

    user.permission = numberPermission(...resultPermissions).toString();

    return await this.userRepository.save(user);
  }
}
