import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { User } from "../../../schemas";

@Injectable()
export class UserManageService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async insertUser(user: User) {
    return await this.userRepository.save(user);
  }
}
