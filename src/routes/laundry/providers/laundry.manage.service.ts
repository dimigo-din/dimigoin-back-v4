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
import { PushManageService } from "../../push/providers";
import { PushNotificationToSpecificDTO } from "src/routes/push/dto/push.manage.dto";

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
    private readonly pushManageService: PushManageService,
  ) {}

  async getLaundryTimelineList() {
    return await this.laundryTimelineRepository.find({
      select: { id: true, name: true, enabled: true },
    });
  }

  async getLaundryTimeline(data: LaundryTimelineIdDTO) {
    return await safeFindOne<LaundryTimeline>(this.laundryTimelineRepository, {
      where: { id: data.id },
      relations: { times: true },
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

    const saved = await this.laundryTimelineRepository.save(laundryTimeline);
    return await safeFindOne<LaundryTimeline>(this.laundryTimelineRepository, saved.id);
  }

  async updateLaundryTimeline(data: UpdateLaundryTimelineDTO) {
    const laundryTimeline = await safeFindOne<LaundryTimeline>(this.laundryTimelineRepository, {
      where: { id: data.id },
      relations: { times: true },
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

    const saved = await this.laundryTimelineRepository.save(laundryTimeline);
    return await safeFindOne<LaundryTimeline>(this.laundryTimelineRepository, saved.id);
  }

  async deleteLaundryTimeline(data: LaundryTimelineIdDTO) {
    const laundryTimeline = await safeFindOne<LaundryTimeline>(
      this.laundryTimelineRepository,
      data.id,
    );
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

    const saved = await this.laundryMachineRepository.save(laundryMachine);
    return await safeFindOne<LaundryMachine>(this.laundryMachineRepository, saved.id);
  }

  async updateLaundryMachine(data: UpdateLaundryMachineDTO) {
    const laundryMachine = await safeFindOne<LaundryMachine>(
      this.laundryMachineRepository,
      data.id,
    );
    laundryMachine.type = data.type;
    laundryMachine.name = data.name;
    laundryMachine.gender = data.gender;
    laundryMachine.enabled = data.enabled;

    const saved = await this.laundryMachineRepository.save(laundryMachine);
    return await safeFindOne<LaundryMachine>(this.laundryMachineRepository, saved.id);
  }

  async deleteLaundryMachine(data: LaundryMachineIdDTO) {
    const laundryMachine = await safeFindOne<LaundryMachine>(
      this.laundryMachineRepository,
      data.id,
    );
    return await this.laundryMachineRepository.remove(laundryMachine);
  }

  async getLaundryApplyList() {
    return await this.laundryApplyRepository.find({
      where: { laundryTimeline: { enabled: true }, date: moment().format("YYYY-MM-DD") },
      relations: { user: true, laundryMachine: true, laundryTime: true, laundryTimeline: true }
    });
  }

  async createLaundryApply(data: CreateLaundryApplyDTO) {
    const laundryTimeline = await safeFindOne<LaundryTimeline>(this.laundryTimelineRepository, {
      where: { times: { id: data.laundryTime } },
    });
    const laundryTime = await safeFindOne<LaundryTime>(
      this.laundryTimeRepository,
      data.laundryTime,
    );
    const laundryMachine = await safeFindOne<LaundryMachine>(
      this.laundryMachineRepository,
      data.machine,
    );
    const user = await safeFindOne<User>(this.userRepository, data.user);

    const applyExists = await this.laundryApplyRepository.findOne({ where: { user: user } });
    if (applyExists)
      throw new HttpException(
        ErrorMsg.LaundryApply_AlreadyExists(laundryMachine.type === "washer" ? "세탁" : "건조"),
        HttpStatus.BAD_REQUEST,
      );

    const machineTaken = await this.laundryApplyRepository.findOne({
      where: { laundryMachine: laundryMachine },
    });
    if (machineTaken)
      throw new HttpException(ErrorMsg.LaundryMachine_AlreadyTaken(), HttpStatus.BAD_REQUEST);

    const date = moment().format("YYYY-MM-DD");

    const laundryApply = new LaundryApply();
    laundryApply.date = date;
    laundryApply.laundryTimeline = laundryTimeline;
    laundryApply.laundryTime = laundryTime;
    laundryApply.laundryMachine = laundryMachine;
    laundryApply.user = user;

    const saved = await this.laundryApplyRepository.save(laundryApply);
    return await safeFindOne<LaundryApply>(this.laundryApplyRepository, saved.id);
  }

  async updateLaundryApply(data: UpdateLaundryApplyDTO) {
    const laundryApply = await safeFindOne<LaundryApply>(this.laundryApplyRepository, data.id);
    const user = await safeFindOne<User>(this.userRepository, data.user);

    laundryApply.user = user;

    const saved = await this.laundryApplyRepository.save(laundryApply);
    return await safeFindOne<LaundryApply>(this.laundryApplyRepository, saved.id);
  }

  async deleteLaundryApply(data: LaundryApplyIdDTO) {
    const laundryApply = await safeFindOne<LaundryApply>(this.laundryApplyRepository, data.id);

    return await this.laundryApplyRepository.remove(laundryApply);
  }

  @Cron(CronExpression.EVERY_HOUR)
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

    // returns when trigger triggered
    const stayTimeline = timelinesByTrigger.find((x) => x.triggeredOn === "stay");
    if (stayTimeline) {
      const today = moment().tz("Asia/Seoul").format("YYYY-MM-DD");
      const stay = await this.stayRepository.findOne({
        where: { stay_from: LessThanOrEqual(today), stay_to: MoreThanOrEqual(today) },
      });
      if (stay && !stayTimeline.enabled) {
        await disable();
        stayTimeline.enabled = true;
        await this.laundryTimelineRepository.save(stayTimeline);
        return;
      } else if (stay && stayTimeline.enabled) return;
    }

    // enable primary when function not returned so any trigger suitable for it.
    const primary = timelinesByTrigger.find((x) => x.triggeredOn === "primary");
    if (primary && !primary.enabled) {
      await disable();
      primary.enabled = true;
      await this.laundryTimelineRepository.save(primary);
      return;
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  private async laundryNotificationScheduler() {
    const now = moment().tz("Asia/Seoul");
    const inTenMinutes = now.add(15, "minutes").format("HH:mm");
    const applies = await this.laundryApplyRepository.find({
      where: {
        date: moment().format("YYYY-MM-DD"),
        laundryTime: { time: inTenMinutes },
      },
      relations: { user: true, laundryMachine: true, laundryTime: true },
    });

    for (const apply of applies) {
      const user = apply.user;

      const machineType = apply.laundryMachine.type === "washer" ? "세탁" : "건조";
      const title = `${machineType} 알림`;
      const body = `15분뒤 ${apply.laundryTime.time}에 ${machineType}이 예약되어 있습니다. (${apply.laundryMachine.name})`;

      const dto: PushNotificationToSpecificDTO = {
        to: [user.id],
        title: title,
        body: body,
        url: "/laundry",
        data: undefined,
        actions: [],
        icon: "https://dimigoin.io/dimigoin.png",
        badge: "https://dimigoin.io/dimigoin.png"
      };

      this.pushManageService.sendToUser(dto);
    }
  }
}
