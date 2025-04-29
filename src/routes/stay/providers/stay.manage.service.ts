import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import * as moment from "moment";
import {
  FindOneOptions,
  IsNull,
  LessThan,
  LessThanOrEqual,
  MoreThanOrEqual,
  Not,
  Repository,
} from "typeorm";

import { ErrorMsg } from "../../../common/mapper/error";
import {
  Stay,
  StayApply,
  StayApplyPeriod_Stay,
  StayApplyPeriod_StaySchedule,
  StayOuting,
  StaySchedule,
  StaySeatPreset,
  StaySeatPresetRange,
  User,
} from "../../../schemas";
import { UserManageService } from "../../user/providers";
import {
  CreateStayApplyDTO,
  CreateStayDTO,
  CreateStayScheduleDTO,
  CreateStaySeatPresetDTO,
  StayApplyIdDTO,
  DeleteStayDTO,
  StayIdDTO,
  StayScheduleIdDTO,
  StaySeatPresetIdDTO,
  UpdateStayApplyDTO,
  UpdateStayDTO,
  UpdateStayScheduleDTO,
  UpdateStaySeatPresetDTO,
} from "../dto/stay.manage.dto";

@Injectable()
export class StayManageService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Stay)
    private readonly stayRepository: Repository<Stay>,
    @InjectRepository(StayApply)
    private readonly stayApplyRepository: Repository<StayApply>,
    @InjectRepository(StayOuting)
    private readonly stayOutingRepository: Repository<StayOuting>,
    @InjectRepository(StaySchedule)
    private readonly stayScheduleRepository: Repository<StaySchedule>,
    @InjectRepository(StaySeatPreset)
    private readonly staySeatPresetRepository: Repository<StaySeatPreset>,
    @InjectRepository(StaySeatPresetRange)
    private readonly staySeatPresetRangeRepository: Repository<StaySeatPresetRange>,
    @InjectRepository(StayApplyPeriod_Stay)
    private readonly stayApplyPeriod_Stay_Repository: Repository<StayApplyPeriod_Stay>,
    @InjectRepository(StayApplyPeriod_StaySchedule)
    private readonly stayApplyPeriod_StaySchedule_Repository: Repository<StayApplyPeriod_StaySchedule>,
    private readonly userManageServie: UserManageService,
  ) {}

  async getStaySeatPresetList() {
    const staySeatPresets = await this.staySeatPresetRepository.find();

    return staySeatPresets.map((staySeatPresets) => {
      return { id: staySeatPresets.id, name: staySeatPresets.name };
    });
  }

  // TODO: stay seat merging
  async getStaySeatPreset(data: StaySeatPresetIdDTO) {
    const staySeatPreset = await this.safeFindOne<StaySeatPreset>(this.staySeatPresetRepository, {
      where: { id: data.id },
    });

    return staySeatPreset;
  }

  async createStaySeatPreset(data: CreateStaySeatPresetDTO) {
    const staySeatPreset = new StaySeatPreset();
    staySeatPreset.name = data.name;
    staySeatPreset.only_readingRoom = data.only_readingRoom;

    const staySeatPresetRanges: StaySeatPresetRange[] = [];
    for (const ranges of data.mappings) {
      for (const range of ranges.ranges) {
        const staySeatPresetRange = new StaySeatPresetRange();
        staySeatPresetRange.target = ranges.target;
        staySeatPresetRange.range = range;
        staySeatPresetRange.stay_seat_preset = staySeatPreset;
        staySeatPresetRanges.push(staySeatPresetRange);
      }
    }

    const result = await this.staySeatPresetRepository.save(staySeatPreset);
    await this.staySeatPresetRangeRepository.save(staySeatPresetRanges);

    return await this.staySeatPresetRepository.findOne({ where: { id: result.id } });
  }

  async updateStaySeatPreset(data: UpdateStaySeatPresetDTO) {
    const staySeatPreset = await this.safeFindOne<StaySeatPreset>(this.staySeatPresetRepository, {
      where: { id: data.id },
    });
    staySeatPreset.name = data.name;
    staySeatPreset.only_readingRoom = data.only_readingRoom;

    await this.staySeatPresetRangeRepository.remove(staySeatPreset.stay_seat);

    const staySeatPresetRanges: StaySeatPresetRange[] = [];
    for (const ranges of data.mappings) {
      for (const range of ranges.ranges) {
        const staySeatPresetRange = new StaySeatPresetRange();
        staySeatPresetRange.target = ranges.target;
        staySeatPresetRange.range = range;
        staySeatPresetRange.stay_seat_preset = staySeatPreset;
        staySeatPresetRanges.push(staySeatPresetRange);
      }
    }
    await this.staySeatPresetRangeRepository.save(staySeatPresetRanges);

    return await this.staySeatPresetRepository.findOne({ where: { id: data.id } });
  }

  async deleteStaySeatPreset(data: StaySeatPresetIdDTO) {
    const staySeatPreset = await this.safeFindOne<StaySeatPreset>(this.staySeatPresetRepository, {
      where: { id: data.id },
    });

    return await this.staySeatPresetRepository.remove(staySeatPreset);
  }

  async getStayScheduleList() {
    const staySchedules = await this.stayScheduleRepository.find();

    return staySchedules.map((e) => {
      return { id: e.id, name: e.name };
    });
  }

  async getStaySchedule(data: StayScheduleIdDTO) {
    return await this.stayScheduleRepository.findOne({ where: { id: data.id } });
  }

  async createStaySchedule(data: CreateStayScheduleDTO) {
    const staySeatPreset = await this.staySeatPresetRepository.findOne({
      where: { id: data.staySeatPreset },
    });
    if (!staySeatPreset) throw new HttpException(ErrorMsg.Resource_NotFound, HttpStatus.NOT_FOUND);

    const staySchedule = new StaySchedule();
    staySchedule.name = data.name;
    staySchedule.stay_from = data.stay_from;
    staySchedule.stay_to = data.stay_to;
    staySchedule.outing_day = data.outing_day;
    staySchedule.stay_seat_preset = staySeatPreset;

    staySchedule.stay_apply_period = [];
    for (const period of data.stayApplyPeriod) {
      const stayApplyPeriod = new StayApplyPeriod_StaySchedule();
      stayApplyPeriod.grade = period.grade;
      stayApplyPeriod.apply_start_day = period.apply_start_day;
      stayApplyPeriod.apply_start_hour = period.apply_start_hour;
      stayApplyPeriod.apply_end_day = period.apply_end_day;
      stayApplyPeriod.apply_end_hour = period.apply_end_hour;

      staySchedule.stay_apply_period.push(stayApplyPeriod);
    }

    await this.stayApplyPeriod_StaySchedule_Repository.save(staySchedule.stay_apply_period);
    return await this.stayScheduleRepository.save(staySchedule);
  }

  async updateStaySchedule(data: UpdateStayScheduleDTO) {
    const staySeatPreset = await this.staySeatPresetRepository.findOne({
      where: { id: data.staySeatPreset },
    });
    if (!staySeatPreset) throw new HttpException(ErrorMsg.Resource_NotFound, HttpStatus.NOT_FOUND);

    const staySchedule = await this.safeFindOne<StaySchedule>(this.stayScheduleRepository, {
      where: { id: data.id },
    });

    // update period
    staySchedule.name = data.name;
    staySchedule.stay_from = data.stay_from;
    staySchedule.stay_to = data.stay_to;
    staySchedule.outing_day = data.outing_day;
    staySchedule.stay_seat_preset = staySeatPreset;

    await this.stayApplyPeriod_StaySchedule_Repository.remove(staySchedule.stay_apply_period);
    staySchedule.stay_apply_period = [];
    for (const period of data.stayApplyPeriod) {
      const stayApplyPeriod = new StayApplyPeriod_StaySchedule();
      stayApplyPeriod.grade = period.grade;
      stayApplyPeriod.apply_start_day = period.apply_start_day;
      stayApplyPeriod.apply_start_hour = period.apply_start_hour;
      stayApplyPeriod.apply_end_day = period.apply_end_day;
      stayApplyPeriod.apply_end_hour = period.apply_end_hour;

      staySchedule.stay_apply_period.push(stayApplyPeriod);
    }

    await this.stayApplyPeriod_StaySchedule_Repository.save(staySchedule.stay_apply_period);
    return await this.stayScheduleRepository.save(staySchedule);
  }

  async deleteStaySchedule(data: StayScheduleIdDTO) {
    const staySchedule = await this.safeFindOne<StaySchedule>(this.stayScheduleRepository, {
      where: { id: data.id },
    });

    return await this.stayScheduleRepository.remove(staySchedule);
  }

  async getStayList() {
    return (await this.stayRepository.find()).map((e) => {
      return { id: e.id, name: e.name };
    });
  }

  async getStay(data: StayIdDTO) {
    return await this.stayRepository.findOne({ where: { id: data.id } });
  }

  async createStay(data: CreateStayDTO) {
    const staySeatPreset = await this.staySeatPresetRepository.findOne({
      where: { id: data.seat_preset },
    });
    if (!staySeatPreset) throw new HttpException(ErrorMsg.Resource_NotFound, HttpStatus.NOT_FOUND);

    const stay = new Stay();
    stay.name = data.name;
    stay.stay_from = data.from;
    stay.stay_to = data.to;
    stay.stay_seat_preset = staySeatPreset;
    stay.outing_day = data.outing_day;

    stay.stay_apply_period = [];
    for (const period of data.period) {
      const stayApplyPeriod = new StayApplyPeriod_Stay();
      stayApplyPeriod.grade = period.grade;
      stayApplyPeriod.apply_start = period.start;
      stayApplyPeriod.apply_end = period.end;

      stay.stay_apply_period.push(stayApplyPeriod);
    }

    await this.stayApplyPeriod_Stay_Repository.save(stay.stay_apply_period);
    return await this.stayRepository.save(stay);
  }

  async updateStay(data: UpdateStayDTO) {
    const stay = await this.safeFindOne<Stay>(this.stayRepository, { where: { id: data.id } });

    const staySeatPreset = await this.staySeatPresetRepository.findOne({
      where: { id: data.seat_preset },
    });
    if (!staySeatPreset) throw new HttpException(ErrorMsg.Resource_NotFound, HttpStatus.NOT_FOUND);

    stay.name = data.name;
    stay.stay_from = data.from;
    stay.stay_to = data.to;
    stay.stay_seat_preset = staySeatPreset;

    await this.stayApplyPeriod_Stay_Repository.remove(stay.stay_apply_period);
    stay.stay_apply_period = [];
    for (const period of data.period) {
      const stayApplyPeriod = new StayApplyPeriod_Stay();
      stayApplyPeriod.grade = period.grade;
      stayApplyPeriod.apply_start = period.start;
      stayApplyPeriod.apply_end = period.end;

      stay.stay_apply_period.push(stayApplyPeriod);
    }

    await this.stayApplyPeriod_Stay_Repository.save(stay.stay_apply_period);
    return await this.stayRepository.save(stay);
  }

  async deleteStay(data: DeleteStayDTO) {
    const stay = await this.safeFindOne<Stay>(this.stayRepository, { where: { id: data.id } });

    return await this.stayRepository.remove(stay);
  }

  async getStayApplyList(data: StayIdDTO) {
    const stay = await this.getStay(data);
    if (!stay) throw new HttpException(ErrorMsg.Resource_NotFound, HttpStatus.NOT_FOUND);

    return (await this.stayApplyRepository.find({ where: { stay: stay } })).map((e) => {
      return {
        id: e.id,
        user: e.user,
        stay: e.stay,
      };
    });
  }

  async getStayApply(data: StayApplyIdDTO) {
    const stayApply = await this.stayApplyRepository.findOne({ where: { id: data.id } });
    return {
      ...stayApply,
      user: {
        ...stayApply.user,
        ...(await this.userManageServie.fetchUserDetail({ email: stayApply.user.email })),
      },
    };
  }

  async createStayApply(data: CreateStayApplyDTO) {
    const user = await this.safeFindOne<User>(this.userRepository, { where: { id: data.user } });
    const stay = await this.safeFindOne<Stay>(this.stayRepository, { where: { id: data.stay } });

    const exists = await this.stayApplyRepository.findOne({
      where: { user: user, stay: stay },
    });
    if (exists) throw new HttpException(ErrorMsg.StaySeat_Duplication, HttpStatus.BAD_REQUEST);

    const staySeatCheck = await this.stayApplyRepository.findOne({
      where: { stay_seat: data.stay_seat.toUpperCase(), stay: stay },
    }); // Allow if same as previous user's seat
    if (staySeatCheck)
      throw new HttpException(ErrorMsg.StaySeat_Duplication, HttpStatus.BAD_REQUEST);

    // teacher can force stay_seat. so, stay_seat will not be filtered.
    const stayApply = new StayApply();
    stayApply.stay_seat = data.stay_seat.toUpperCase();
    stayApply.user = user;
    stayApply.stay = stay;

    stayApply.outing = [];
    for (const outingData of data.outing) {
      const outing = new StayOuting();
      outing.reason = outingData.reason;
      outing.breakfast_cancel = outingData.breakfast_cancel;
      outing.lunch_cancel = outingData.lunch_cancel;
      outing.dinner_cancel = outingData.dinner_cancel;
      outing.from = outingData.from;
      outing.to = outingData.to;
      outing.approved = outingData.approved;
      outing.audit_reason = outingData.audit_reason;

      stayApply.outing.push(outing);
    }

    await this.stayOutingRepository.save(stayApply.outing);
    return await this.stayApplyRepository.save(stayApply);
  }

  async updateStayApply(data: UpdateStayApplyDTO) {
    const stayApply = await this.safeFindOne<StayApply>(this.stayApplyRepository, {
      where: { id: data.id },
    });
    const user = await this.safeFindOne<User>(this.userRepository, { where: { id: data.user } });
    const stay = await this.safeFindOne<Stay>(this.stayRepository, { where: { id: data.stay } });

    const staySeatCheck = await this.stayApplyRepository.findOne({
      where: { stay_seat: data.stay_seat.toUpperCase(), stay: stay },
    }); // Allow if same as previous user's seat
    if (staySeatCheck && stayApply.stay_seat !== data.stay_seat.toUpperCase())
      throw new HttpException(ErrorMsg.StaySeat_Duplication, HttpStatus.BAD_REQUEST);

    stayApply.stay_seat = data.stay_seat.toUpperCase();
    stayApply.user = user;
    stayApply.stay = stay;

    await this.stayOutingRepository.remove(stayApply.outing);
    stayApply.outing = [];
    for (const outingData of data.outing) {
      const outing = new StayOuting();
      outing.reason = outingData.reason;
      outing.breakfast_cancel = outingData.breakfast_cancel;
      outing.lunch_cancel = outingData.lunch_cancel;
      outing.dinner_cancel = outingData.dinner_cancel;
      outing.from = outingData.from;
      outing.to = outingData.to;
      outing.approved = outingData.approved;
      outing.audit_reason = outingData.audit_reason;

      stayApply.outing.push(outing);
    }

    await this.stayOutingRepository.save(stayApply.outing);
    return await this.stayApplyRepository.save(stayApply);
  }

  async deleteStayApply(data: StayApplyIdDTO) {
    const stayApply = await this.safeFindOne<StayApply>(this.stayApplyRepository, {
      where: { id: data.id },
    });

    return await this.stayApplyRepository.remove(stayApply);
  }

  private async safeFindOne<T>(
    repo: Repository<T>,
    condition: FindOneOptions<T>,
    error = new HttpException(ErrorMsg.Resource_NotFound, HttpStatus.NOT_FOUND),
  ) {
    const result = await repo.findOne(condition);
    if (!result) throw error;
    return result;
  }

  private weekday2date(base: moment.Moment, weekday: number) {
    const target = base.clone().weekday(weekday);
    if (target.isBefore(base)) target.add(1, "week");
    return target.format("YYYY-MM-DD");
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async syncStay() {
    // register stay
    const schedules = await this.stayScheduleRepository.find({
      where: {
        stay_apply_period: {
          apply_start_day: LessThanOrEqual(moment().weekday()),
          apply_end_day: MoreThanOrEqual(moment().weekday()),
        },
      },
    });

    const existingStay = (
      await this.stayRepository.find({
        where: {
          parent: Not(IsNull()),
          stay_apply_period: {
            apply_start: LessThanOrEqual(new Date().toISOString()),
            apply_end: MoreThanOrEqual(new Date().toISOString()),
          },
        },
      })
    ).map((x) => x.parent.id);

    const targetSchedules = schedules.filter((x) => !existingStay.find((y) => y === x.id));
    for (const target of targetSchedules) {
      const now = moment().startOf("day");

      const stay = new Stay();
      stay.name = target.name;
      stay.stay_from = this.weekday2date(now, target.stay_from);
      stay.stay_to = this.weekday2date(now, target.stay_to);
      stay.outing_day = target.outing_day.map((day) => this.weekday2date(now, day));
      stay.stay_seat_preset = target.stay_seat_preset;
      stay.parent = target;

      // stay_apply_period 복제 (Stay용 Period를 새로 생성)
      stay.stay_apply_period = target.stay_apply_period.map((period) => {
        const p = new StayApplyPeriod_Stay();
        p.grade = period.grade;

        p.apply_start = now
          .clone()
          .weekday(period.apply_start_day)
          .hour(period.apply_start_hour)
          .minute(0)
          .second(0)
          .toISOString();
        p.apply_end = now
          .clone()
          .weekday(period.apply_end_day)
          .hour(period.apply_end_hour)
          .minute(0)
          .second(0)
          .toISOString();
        return p;
      });

      await this.stayApplyPeriod_Stay_Repository.save(stay.stay_apply_period);
      await this.stayRepository.save(stay);
    }

    // remove previous stay
    await this.stayRepository.softDelete({ stay_to: LessThan(moment().format("YYYY-MM-DD")) });
  }
}
