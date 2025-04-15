import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import * as bcrypt from "bcrypt";
import { Repository } from "typeorm";

import { ErrorMsg } from "../../../common/mapper/error";
import { PermissionType } from "../../../common/mapper/permissions";
import { numberPermission, parsePermission } from "../../../common/utils/permission.util";
import { Login, User } from "../../../schemas";
import { PersonalInformationSchema } from "../../../schemas/personal-information.schema";
import { AddPermissionDTO, CreateUserDTO, RemovePermissionDTO, SetPermissionDTO } from "../dto";

@Injectable()
export class UserManageService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Login)
    private readonly loginRepository: Repository<Login>,
    @InjectRepository(PersonalInformationSchema)
    private readonly personalInformationRepository: Repository<PersonalInformationSchema>,
  ) {}

  async getUserById(id: string): Promise<User> {
    return await this.userRepository.findOne({ where: { id } });
  }

  // TODO: get from array
  async fetchUserDetail(data: { id?: string; email?: string }) {
    if (data.id) {
      const user = await this.userRepository.findOne({ where: { id: data.id } });
      if (!user) throw new HttpException(ErrorMsg.Resource_NotFound, HttpStatus.NOT_FOUND);

      const personalInformation = await this.personalInformationRepository.findOne({
        where: { email: user.email },
      });

      return {
        email: personalInformation.email,
        grade: personalInformation.grade,
        class: personalInformation.class,
        number: personalInformation.number,
        hakbun: personalInformation.hakbun,
      };
    } else if (data.email) {
      const personalInformation = await this.personalInformationRepository.findOne({
        where: { email: data.email },
      });

      return {
        email: personalInformation.email,
        grade: personalInformation.grade,
        class: personalInformation.class,
        number: personalInformation.number,
        hakbun: personalInformation.hakbun,
      };
    }
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

  async addPasswordLogin(user: string, password: string) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const dbUser = await this.userRepository.findOne({ where: { id: user } });
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
