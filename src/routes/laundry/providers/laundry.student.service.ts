import { TZDate } from "@date-fns/tz";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { addHours, format, isAfter, startOfDay } from "date-fns";
import { Repository } from "typeorm";
import { LaundryApply, LaundryMachine, LaundryTime, LaundryTimeline, User } from "#/schemas";
import { ErrorMsg } from "$mapper/error";
import type { Grade, UserJWT } from "$mapper/types";
import { safeFindOne } from "$utils/safeFindOne.util";
import { LaundryApplyDTO, LaundryApplyIdDTO } from "~laundry/dto/laundry.student.dto";
import { UserManageService } from "~user/providers";

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
    return await this.laundryApplyRepository
      .createQueryBuilder("apply")
      .leftJoinAndSelect("apply.laundryTime", "time")
      .leftJoinAndSelect("time.assigns", "assigns")
      .leftJoinAndSelect("apply.laundryMachine", "machine")
      .leftJoin("apply.user", "user")
      .addSelect(["user.id", "user.name"])
      .leftJoin("apply.laundryTimeline", "timeline")
      .where("timeline.enabled = :enabled", { enabled: true })
      .andWhere("apply.date = :date", { date: format(new TZDate(new Date, "Asia/Seoul"), "yyyy-MM-dd") })
      .getMany();
  }

  async createApply(user: UserJWT, data: LaundryApplyDTO) {
    const now = new Date();
    const seoulNow = new TZDate(now, "Asia/Seoul");
    const eightAM = addHours(startOfDay(seoulNow), 8);
    if (!isAfter(seoulNow, eightAM)) {
      throw new HttpException(ErrorMsg.LaundryApplyIsAfterEightAM(), HttpStatus.BAD_REQUEST);
    }

    const dbUser = await safeFindOne<User>(this.userRepository, user.id);

    const machine = await safeFindOne<LaundryMachine>(this.laundryMachineRepository, data.machine);

    const applyExists = await this.laundryApplyRepository.findOne({
      where: {
        user: dbUser,
        date: format(new TZDate(now, "Asia/Seoul"), "yyyy-MM-dd"),
        laundryMachine: { type: machine.type },
      },
    });
    if (applyExists) {
      throw new HttpException(
        ErrorMsg.LaundryApply_AlreadyExists(machine.type === "washer" ? "세탁" : "건조"),
        HttpStatus.BAD_REQUEST,
      );
    }

    const timeline = await safeFindOne<LaundryTimeline>(this.laundryTimelineRepository, {
      where: { times: { id: data.time } },
    });
    const time = await safeFindOne<LaundryTime>(this.laundryTimeRepository, data.time);

    if (
      time.grade.indexOf(data.grade as Grade) === -1 ||
      !(await this.userManageService.checkUserDetail(user.email, {
        grade: data.grade,
        gender: machine.gender,
      }))
    ) {
      throw new HttpException(ErrorMsg.PermissionDenied_Resource_Grade(), HttpStatus.FORBIDDEN);
    }

    const machineTaken = await this.laundryApplyRepository.findOne({
      where: {
        laundryMachine: machine,
        date: format(new TZDate(now, "Asia/Seoul"), "yyyy-MM-dd"),
        laundryTime: time,
      },
    });
    if (machineTaken) {
      throw new HttpException(ErrorMsg.LaundryMachine_AlreadyTaken(), HttpStatus.BAD_REQUEST);
    }

    const apply = new LaundryApply();
    apply.laundryTimeline = timeline;
    apply.laundryTime = time;
    apply.laundryMachine = machine;
    apply.user = dbUser;
    apply.date = format(new TZDate(now, "Asia/Seoul"), "yyyy-MM-dd");

    return await this.laundryApplyRepository.save(apply);
  }

  async deleteApply(user: UserJWT, data: LaundryApplyIdDTO) {
    const apply = await safeFindOne<LaundryApply>(this.laundryApplyRepository, {
      where: { user: { id: user.id }, id: data.id },
    });

    return await this.laundryApplyRepository.remove(apply);
  }
}
