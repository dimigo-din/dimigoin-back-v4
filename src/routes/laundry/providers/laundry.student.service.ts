import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import * as moment from "moment";
import { Repository } from "typeorm";

import { ErrorMsg } from "../../../common/mapper/error";
import { UserJWT } from "../../../common/mapper/types";
import { safeFindOne } from "../../../common/utils/safeFindOne.util";
import { LaundryApply, LaundryMachine, LaundryTime, LaundryTimeline, User } from "../../../schemas";
import { UserManageService } from "../../user/providers";
import { LaundryApplyDTO, LaundryApplyIdDTO } from "../dto/laundry.student.dto";

@Injectable()
export class LaundryStudentService {
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
    private readonly userManageService: UserManageService,
  ) {}

  async getTimeline() {
    return await safeFindOne<LaundryTimeline>(this.laundryTimelineRepository, {
      where: { enabled: true },
      relations: { times: { assigns: true } },
    });
  }

  async getApplies() {
    return (
      await this.laundryApplyRepository.find({
        where: { laundryTimeline: { enabled: true }, date: moment().format("YYYY-MM-DD") },
        relations: { laundryTime: true, laundryMachine: true, user: true },
      })
    ).map((a) => {
      return { ...a, user: { id: a.user.id, name: a.user.name } };
    });
  }

  async createApply(user: UserJWT, data: LaundryApplyDTO) {
    if (!moment().isAfter(moment().tz("Asia/Seoul").startOf("day").add("8", "hours")))
      throw new HttpException(ErrorMsg.LaundryApplyIsAfterEightAM(), HttpStatus.BAD_REQUEST);

    const dbUser = await safeFindOne<User>(this.userRepository, user.id);

    const machine = await safeFindOne<LaundryMachine>(this.laundryMachineRepository, data.machine);

    const applyExists = await this.laundryApplyRepository.findOne({
      where: {
        user: dbUser,
        date: moment().tz("Asia/Seoul").format("YYYY-MM-DD"),
        laundryMachine: { type: machine.type },
      },
    });
    if (applyExists)
      throw new HttpException(
        ErrorMsg.LaundryApply_AlreadyExists(machine.type === "washer" ? "세탁" : "건조"),
        HttpStatus.BAD_REQUEST,
      );

    const timeline = await safeFindOne<LaundryTimeline>(this.laundryTimelineRepository, {
      where: { times: { id: data.time } },
    });
    const time = await safeFindOne<LaundryTime>(this.laundryTimeRepository, data.time);

    if (
      time.grade.indexOf(data.grade) === -1 ||
      !(await this.userManageService.checkUserDetail(user.email, {
        grade: data.grade,
        gender: machine.gender,
      }))
    )
      throw new HttpException(ErrorMsg.PermissionDenied_Resource_Grade(), HttpStatus.FORBIDDEN);

    const machineTaken = await this.laundryApplyRepository.findOne({
      where: {
        laundryMachine: machine,
        date: moment().tz("Asia/Seoul").format("YYYY-MM-DD"),
        laundryTime: time,
      },
    });
    if (machineTaken)
      throw new HttpException(ErrorMsg.LaundryMachine_AlreadyTaken(), HttpStatus.BAD_REQUEST);

    const apply = new LaundryApply();
    apply.laundryTimeline = timeline;
    apply.laundryTime = time;
    apply.laundryMachine = machine;
    apply.user = dbUser;
    apply.date = moment().tz("Asia/Seoul").format("YYYY-MM-DD");

    return await this.laundryApplyRepository.save(apply);
  }

  async deleteApply(user: UserJWT, data: LaundryApplyIdDTO) {
    const apply = await safeFindOne<LaundryApply>(this.laundryApplyRepository, {
      where: { user: { id: user.id }, id: data.id },
    });

    return await this.laundryApplyRepository.remove(apply);
  }
}
