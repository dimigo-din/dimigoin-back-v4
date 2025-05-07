import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import * as moment from "moment";
import {
  FindOneOptions,
  In,
  IsNull,
  LessThanOrEqual,
  MoreThanOrEqual,
  Not,
  Repository,
} from "typeorm";

import { ErrorMsg } from "../../../common/mapper/error";
import { safeFindOne } from "../../../common/utils/safeFindOne.util";
import {
  User,
  LaundryMachine,
  LaundryTime,
  LaundryTimeline,
  LaundryApply,
  Stay,
} from "../../../schemas";
import {
  CreateLaundryApplyDTO,
  CreateLaundryMachineDTO,
  CreateLaundryTimelineDTO,
  LaundryApplyIdDTO,
  LaundryMachineIdDTO,
  LaundryTimelineIdDTO,
  UpdateLaundryApplyDTO,
  UpdateLaundryMachineDTO,
  UpdateLaundryTimelineDTO,
} from "../dto/laundry.manage.dto";

@Injectable()
export class LaundryManageService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Stay)
    private readonly stayRepository: Repository<Stay>,
    @InjectRepository(LaundryTime)
    private readonly laundryTimeRepository: Repository<LaundryTime>,
    @InjectRepository(LaundryApply)
    private readonly laundryApplyRepository: Repository<LaundryApply>,
    @InjectRepository(LaundryMachine)
    private readonly laundryMachineRepository: Repository<LaundryMachine>,
    @InjectRepository(LaundryTimeline)
    private readonly laundryTimelineRepository: Repository<LaundryTimeline>,
  ) {}

  async getLaundryTimelineList() {
    return (await this.laundryTimelineRepository.find()).map((e) => {
      return {
        id: e.id,
        name: e.name,
      };
    });
  }

  async getLaundryTimeline(data: LaundryTimelineIdDTO) {
    return await safeFindOne<LaundryTimeline>(this.laundryTimelineRepository, {
      where: {
        id: data.id,
      },
    });
  }

  async createLaundryTimeline(data: CreateLaundryTimelineDTO) {
    const laundryTimeline = new LaundryTimeline();
    laundryTimeline.name = data.name;
    laundryTimeline.triggeredOn = data.triggeredOn;

    laundryTimeline.times = [];
    for (const time of data.times) {
      const laundryTime = new LaundryTime();
      laundryTime.time = time.time;
      laundryTime.grade = time.grade;
      laundryTime.assigns = await this.laundryMachineRepository.find({
        where: { id: In(time.assigns) },
      });
      laundryTime.timeline = laundryTimeline;

      laundryTimeline.times.push(laundryTime);
    }

    const id = (await this.laundryTimelineRepository.save(laundryTimeline)).id;
    await this.laundryTimeRepository.save(laundryTimeline.times);

    return await safeFindOne<LaundryTimeline>(this.laundryTimelineRepository, {
      where: { id: id },
    });
  }

  async updateLaundryTimeline(data: UpdateLaundryTimelineDTO) {
    const laundryTimeline = await safeFindOne<LaundryTimeline>(this.laundryTimelineRepository, {
      where: { id: data.id },
    });
    laundryTimeline.name = data.name;
    laundryTimeline.triggeredOn = data.triggeredOn;

    await this.laundryTimeRepository.remove(laundryTimeline.times);
    laundryTimeline.times = [];
    for (const time of data.times) {
      const laundryTime = new LaundryTime();
      laundryTime.time = time.time;
      laundryTime.grade = time.grade;
      laundryTime.assigns = await this.laundryMachineRepository.find({
        where: { id: In(time.assigns) },
      });
      laundryTime.timeline = laundryTimeline;

      laundryTimeline.times.push(laundryTime);
    }

    const id = (await this.laundryTimelineRepository.save(laundryTimeline)).id;
    await this.laundryTimeRepository.save(laundryTimeline.times);

    return await safeFindOne<LaundryTimeline>(this.laundryTimelineRepository, {
      where: { id: id },
    });
  }

  async deleteLaundryTimeline(data: LaundryTimelineIdDTO) {
    const laundryTimeline = await safeFindOne<LaundryTimeline>(this.laundryTimelineRepository, {
      where: { id: data.id },
    });
    return await this.laundryTimelineRepository.remove(laundryTimeline);
  }

  async enableLaundryTimeline(data: LaundryTimelineIdDTO) {
    const modified = (await this.laundryTimelineRepository.find()).map((timeline) => {
      timeline.enabled = timeline.id === data.id;
      return timeline;
    });
    return await this.laundryTimelineRepository.save(modified);
  }

  async getLaundryMachineList() {
    return await this.laundryMachineRepository.find();
  }

  async createLaundryMachine(data: CreateLaundryMachineDTO) {
    const laundryMachine = new LaundryMachine();
    laundryMachine.type = data.type;
    laundryMachine.name = data.name;
    laundryMachine.gender = data.gender;
    laundryMachine.enabled = data.enabled;

    return await this.laundryMachineRepository.save(laundryMachine);
  }

  async updateLaundryMachine(data: UpdateLaundryMachineDTO) {
    const laundryMachine = await safeFindOne<LaundryMachine>(this.laundryMachineRepository, {
      where: { id: data.id },
    });
    laundryMachine.type = data.type;
    laundryMachine.name = data.name;
    laundryMachine.gender = data.gender;
    laundryMachine.enabled = data.enabled;

    return await this.laundryMachineRepository.save(laundryMachine);
  }

  async deleteLaundryMachine(data: LaundryMachineIdDTO) {
    const laundryMachine = await safeFindOne<LaundryMachine>(this.laundryMachineRepository, {
      where: { id: data.id },
    });
    return await this.laundryMachineRepository.remove(laundryMachine);
  }

  async getLaundryApplyList() {
    return await this.laundryApplyRepository.find({
      where: { laundryTimeline: { enabled: true }, date: moment().format("YYYY-MM-DD") },
    });
  }

  async createLaundryApply(data: CreateLaundryApplyDTO) {
    const laundryTimeline = await safeFindOne<LaundryTimeline>(this.laundryTimelineRepository, {
      where: { times: { id: data.laundryTime } },
    });
    const laundryTime = await safeFindOne<LaundryTime>(this.laundryTimeRepository, {
      where: { id: data.laundryTime },
    });
    const laundryMachine = await safeFindOne<LaundryMachine>(this.laundryMachineRepository, {
      where: { id: data.machine },
    });
    const user = await safeFindOne<User>(this.userRepository, { where: { id: data.user } });

    const applyExists = await this.laundryApplyRepository.findOne({ where: { user: user } });
    if (applyExists)
      throw new HttpException(ErrorMsg.LaundryApply_AlreadyExists, HttpStatus.BAD_REQUEST);

    const machineTaken = await this.laundryApplyRepository.findOne({
      where: { laundryMachine: laundryMachine },
    });
    if (machineTaken)
      throw new HttpException(ErrorMsg.LaundryMachine_AlreadyTaken, HttpStatus.BAD_REQUEST);

    const date = moment().format("YYYY-MM-DD");

    const laundryApply = new LaundryApply();
    laundryApply.date = date;
    laundryApply.laundryTimeline = laundryTimeline;
    laundryApply.laundryTime = laundryTime;
    laundryApply.laundryMachine = laundryMachine;
    laundryApply.user = user;

    return await this.laundryApplyRepository.save(laundryApply);
  }

  async updateLaundryApply(data: UpdateLaundryApplyDTO) {
    const laundryApply = await safeFindOne<LaundryApply>(this.laundryApplyRepository, {
      where: { id: data.id },
    });
    const user = await safeFindOne<User>(this.userRepository, { where: { id: data.user } });

    laundryApply.user = user;

    return await this.laundryApplyRepository.save(laundryApply);
  }

  async deleteLaundryApply(data: LaundryApplyIdDTO) {
    const laundryApply = await safeFindOne<LaundryApply>(this.laundryApplyRepository, {
      where: { id: data.id },
    });

    return await this.laundryApplyRepository.remove(laundryApply);
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  // @Cron(CronExpression.EVERY_SECOND)
  private async laundryTimelineScheduler() {
    const timelines = await this.laundryTimelineRepository.find();
    const timelinesByTrigger = await this.laundryTimelineRepository.find({
      where: { triggeredOn: Not(IsNull()) },
    });

    const disable = async () => {
      await this.laundryTimelineRepository.save(
        timelines.map((x) => {
          x.enabled = false;
          return x;
        }),
      );
    };

    const stayTimeline = timelinesByTrigger.find((x) => x.triggeredOn === "stay");
    if (stayTimeline) {
      const today = moment().format("YYYY-MM-DD");
      const stay = await this.stayRepository.findOne({
        where: { stay_from: LessThanOrEqual(today), stay_to: MoreThanOrEqual(today) },
      });
      if (stay && !stayTimeline.enabled) {
        await disable();
        stayTimeline.enabled = true;
        await this.laundryTimelineRepository.save(stayTimeline);
        return;
      } else if (stayTimeline.enabled) return;
    }

    const primary = timelinesByTrigger.find((x) => x.triggeredOn === "primary");
    if (primary && !primary.enabled) {
      await disable();
      primary.enabled = true;
      await this.laundryTimelineRepository.save(primary);
      return;
    }
  }
}
