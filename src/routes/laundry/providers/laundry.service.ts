import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import * as moment from "moment";
import { FindOneOptions, Repository } from "typeorm";

import { ErrorMsg } from "../../../common/mapper/error";
import { UserJWT } from "../../../common/mapper/types";
import { safeFindOne } from "../../../common/utils/safeFindOne.util";
import { LaundryApply, LaundryMachine, LaundryTime, LaundryTimeline, User } from "../../../schemas";
import { LaundryApplyDTO } from "../dto/laundry.dto";

@Injectable()
export class LaundryService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(LaundryTime)
    private readonly laundryTimeRepository: Repository<LaundryTime>,
    @InjectRepository(LaundryApply)
    private readonly laundryApplyRepository: Repository<LaundryApply>,
    @InjectRepository(LaundryMachine)
    private readonly laundryMachineRepository: Repository<LaundryMachine>,
    @InjectRepository(LaundryTimeline)
    private readonly laundryTimelineRepository: Repository<LaundryTimeline>,
  ) {}

  async getTimeline() {
    return await safeFindOne<LaundryTimeline>(this.laundryTimelineRepository, {
      where: { enabled: true },
    });
  }

  async getApplies() {
    return await this.laundryApplyRepository.find({
      where: { laundryTimeline: { enabled: true }, date: moment().format("YYYY-MM-DD") },
    });
  }

  async createApply(user: UserJWT, data: LaundryApplyDTO) {
    const dbUser = await safeFindOne<User>(this.userRepository, { where: { id: user.id } });

    const applyExists = await this.laundryApplyRepository.find({ where: { user: user } });
    if (applyExists)
      throw new HttpException(ErrorMsg.LaundryApply_AlreadyExists, HttpStatus.BAD_REQUEST);

    const timeline = await safeFindOne<LaundryTimeline>(this.laundryTimelineRepository, {
      where: { times: { id: data.time } },
    });
    const time = await safeFindOne<LaundryTime>(this.laundryTimeRepository, {
      where: { id: data.time },
    });
    const machine = await safeFindOne<LaundryMachine>(this.laundryMachineRepository, {
      where: { id: data.machine },
    });

    const machineTaken = await this.laundryApplyRepository.find({
      where: { laundryMachine: machine },
    });
    if (machineTaken)
      throw new HttpException(ErrorMsg.LaundryMachine_AlreadyTaken, HttpStatus.BAD_REQUEST);

    const apply = new LaundryApply();
    apply.laundryTimeline = timeline;
    apply.laundryTime = time;
    apply.laundryMachine = machine;
    apply.user = dbUser;
    apply.date = moment().format("YYYY-MM-DD");

    return await this.laundryApplyRepository.save(apply);
  }

  async deleteApply(user: UserJWT) {
    const apply = await safeFindOne<LaundryApply>(this.laundryApplyRepository, {
      where: { user: { id: user.id } },
    });

    return await this.laundryApplyRepository.remove(apply);
  }
}
