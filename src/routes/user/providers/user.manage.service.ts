import { Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import axios, { AxiosInstance } from "axios";
import * as bcrypt from "bcrypt";
import { Like, Repository } from "typeorm";
import { PermissionType } from "../../../common/mapper/permissions";
import { Grade } from "../../../common/mapper/types";
import { numberPermission, parsePermission } from "../../../common/utils/permission.util";
import { Login, User } from "../../../schemas";
import {
  AddPermissionDTO,
  CreateUserDTO,
  RemovePermissionDTO,
  SearchUserDTO,
  SetPermissionDTO,
} from "../dto";

// this chuck of code need to be refactored
@Injectable()
export class UserManageService {
  private client: AxiosInstance;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Login)
    private readonly loginRepository: Repository<Login>,
    private readonly configService: ConfigService,
  ) {
    this.client = axios.create({
      baseURL: this.configService.get<string>("PERSONAL_INFORMATION_SERVER"),
    });
    this.client.interceptors.request.use((config) => {
      config.headers.setAuthorization(
        `Bearer ${this.configService.get<string>("PERSONAL_INFORMATION_TOKEN")}`,
      );
      return config;
    });
    this.client.interceptors.response.use(
      (res) => res,
      (error) => {
        if (!error.response) {
          return Promise.reject(error);
        }
        if (error.response.status - 400 >= 0 && error.response.status - 400 < 100) {
          return Promise.resolve(error.response);
        }
        return Promise.reject(error);
      },
    );
  }

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
    const res = await this.client.post("/personalInformation/check", {
      mail: email,
      ...config,
    });

    if (res.status !== 200) {
      return null;
    } else {
      return res.data as boolean;
    }
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
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

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
