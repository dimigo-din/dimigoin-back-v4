import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { ErrorMsg } from "../../../common/mapper/error";
import {
  Stay,
  StayApply,
  StayApplyPeriod_Stay,
  StayApplyPeriod_StaySchedule,
  StaySchedule,
  StaySeatPreset,
  StaySeatPresetRange,
  User,
} from "../../../schemas";
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
    @InjectRepository(StaySeatPreset)
    private readonly staySeatPresetRepository: Repository<StaySeatPreset>,
    @InjectRepository(StaySeatPresetRange)
    private readonly staySeatPresetRangeRepository: Repository<StaySeatPresetRange>,
    @InjectRepository(StaySchedule)
    private readonly stayScheduleRepository: Repository<StaySchedule>,
    @InjectRepository(StayApplyPeriod_Stay)
    private readonly stayApplyPeriod_Stay_Repository: Repository<StayApplyPeriod_Stay>,
    @InjectRepository(StayApplyPeriod_StaySchedule)
    private readonly stayApplyPeriod_StaySchedule_Repository: Repository<StayApplyPeriod_StaySchedule>,
  ) {}

  async getStaySeatPresetList() {
    const staySeatPresets = await this.staySeatPresetRepository.find();

    return staySeatPresets.map((staySeatPresets) => {
      return { id: staySeatPresets.id, name: staySeatPresets.name };
    });
  }

  async getStaySeatPreset(data: StaySeatPresetIdDTO) {
    const staySeatPreset = await this.staySeatPresetRepository.findOne({ where: { id: data.id } });
    if (!staySeatPreset) throw new HttpException(ErrorMsg.Resource_NotFound, HttpStatus.NOT_FOUND);

    return staySeatPreset;
  }

  async createStaySeatPreset(data: CreateStaySeatPresetDTO) {
    const staySeatPreset = new StaySeatPreset();
    staySeatPreset.name = data.name;

    const staySeatPresetRanges: StaySeatPresetRange[] = [];
    for (const range of data.mappings) {
      const staySeatPresetRange = new StaySeatPresetRange();
      staySeatPresetRange.target = range.target;
      staySeatPresetRange.stay_seat_preset = staySeatPreset;
      staySeatPresetRanges.push(staySeatPresetRange);
    }

    const result = await this.staySeatPresetRepository.save(staySeatPreset);
    await this.staySeatPresetRangeRepository.save(staySeatPresetRanges);

    return await this.staySeatPresetRepository.findOne({ where: { id: result.id } });
  }

  async updateStaySeatPreset(data: UpdateStaySeatPresetDTO) {
    const staySeatPreset = await this.staySeatPresetRepository.findOne({ where: { id: data.id } });
    if (!staySeatPreset) throw new HttpException(ErrorMsg.Resource_NotFound, HttpStatus.NOT_FOUND);

    await this.staySeatPresetRangeRepository.remove(staySeatPreset.stay_seat);

    const staySeatPresetRanges: StaySeatPresetRange[] = [];
    for (const range of data.mappings) {
      const staySeatPresetRange = new StaySeatPresetRange();
      staySeatPresetRange.target = range.target;
      staySeatPresetRange.stay_seat_preset = staySeatPreset;
      staySeatPresetRanges.push(staySeatPresetRange);
    }
    await this.staySeatPresetRangeRepository.save(staySeatPresetRanges);

    return await this.staySeatPresetRepository.findOne({ where: { id: data.id } });
  }

  async deleteStaySeatPreset(data: StaySeatPresetIdDTO) {
    const staySeatPreset = await this.staySeatPresetRepository.findOne({ where: { id: data.id } });
    if (!staySeatPreset) throw new HttpException(ErrorMsg.Resource_NotFound, HttpStatus.NOT_FOUND);

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
    staySchedule.outing_day = data.outing_day.join(",");
    staySchedule.stay_seat_preset = staySeatPreset;
    const dbStaySchedule = await this.stayScheduleRepository.save(staySchedule);

    const stayApplyPeriods: StayApplyPeriod_StaySchedule[] = [];
    for (const period of data.stayApplyPeriod) {
      const stayApplyPeriod = new StayApplyPeriod_StaySchedule();
      stayApplyPeriod.grade = period.grade;
      stayApplyPeriod.apply_start_day = period.apply_start_day;
      stayApplyPeriod.apply_start_hour = period.apply_start_hour;
      stayApplyPeriod.apply_end_day = period.apply_end_day;
      stayApplyPeriod.apply_end_hour = period.apply_end_hour;
      stayApplyPeriod.stay_schedule = dbStaySchedule;
      stayApplyPeriods.push(stayApplyPeriod);
    }
    await this.stayApplyPeriod_StaySchedule_Repository.save(stayApplyPeriods);

    return await this.stayScheduleRepository.findOne({ where: { id: dbStaySchedule.id } });
  }

  async updateStaySchedule(data: UpdateStayScheduleDTO) {
    const staySeatPreset = await this.staySeatPresetRepository.findOne({
      where: { id: data.staySeatPreset },
    });
    if (!staySeatPreset) throw new HttpException(ErrorMsg.Resource_NotFound, HttpStatus.NOT_FOUND);

    const staySchedule = await this.stayScheduleRepository.findOne({ where: { id: data.id } });
    if (!staySchedule) throw new HttpException(ErrorMsg.Resource_NotFound, HttpStatus.NOT_FOUND);

    // update period
    staySchedule.name = data.name;
    staySchedule.stay_from = data.stay_from;
    staySchedule.stay_to = data.stay_to;
    staySchedule.outing_day = data.outing_day.join(",");
    staySchedule.stay_seat_preset = staySeatPreset;
    const dbStaySchedule = await this.stayScheduleRepository.save(staySchedule);

    const stayApplyPeriods: StayApplyPeriod_StaySchedule[] = [];
    for (const period of data.stayApplyPeriod) {
      const stayApplyPeriod = new StayApplyPeriod_StaySchedule();
      stayApplyPeriod.grade = period.grade;
      stayApplyPeriod.apply_start_day = period.apply_start_day;
      stayApplyPeriod.apply_start_hour = period.apply_start_hour;
      stayApplyPeriod.apply_end_day = period.apply_end_day;
      stayApplyPeriod.apply_end_hour = period.apply_end_hour;
      stayApplyPeriod.stay_schedule = dbStaySchedule;
      stayApplyPeriods.push(stayApplyPeriod);
    }
    await this.stayApplyPeriod_StaySchedule_Repository.remove(staySchedule.stay_apply_period);
    await this.stayApplyPeriod_StaySchedule_Repository.save(stayApplyPeriods);

    return await this.stayScheduleRepository.findOne({ where: { id: dbStaySchedule.id } });
  }

  async deleteStaySchedule(data: StayScheduleIdDTO) {
    const staySchedule = await this.stayScheduleRepository.findOne({ where: { id: data.id } });
    if (!staySchedule) throw new HttpException(ErrorMsg.Resource_NotFound, HttpStatus.NOT_FOUND);

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
    const dbStay = await this.stayRepository.save(stay);

    const stayApplyPeriods: StayApplyPeriod_Stay[] = [];
    for (const period of data.period) {
      const stayApplyPeriod = new StayApplyPeriod_Stay();
      stayApplyPeriod.grade = period.grade;
      stayApplyPeriod.apply_start = period.start;
      stayApplyPeriod.apply_end = period.end;
      stayApplyPeriod.stay = dbStay;
      stayApplyPeriods.push(stayApplyPeriod);
    }
    await this.stayApplyPeriod_Stay_Repository.save(stayApplyPeriods);

    return await this.stayRepository.findOne({ where: { id: dbStay.id } });
  }

  async updateStay(data: UpdateStayDTO) {
    const stay = await this.stayRepository.findOne({ where: { id: data.id } });
    if (!stay) throw new HttpException(ErrorMsg.Resource_NotFound, HttpStatus.NOT_FOUND);

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
    const dbStay = await this.stayRepository.save(stay);

    const stayApplyPeriods: StayApplyPeriod_Stay[] = [];
    for (const period of data.period) {
      const stayApplyPeriod = new StayApplyPeriod_Stay();
      stayApplyPeriod.grade = period.grade;
      stayApplyPeriod.apply_start = period.start;
      stayApplyPeriod.apply_end = period.end;
      stayApplyPeriod.stay = dbStay;
      stayApplyPeriods.push(stayApplyPeriod);
    }
    await this.stayApplyPeriod_Stay_Repository.save(stayApplyPeriods);

    return await this.stayRepository.findOne({ where: { id: dbStay.id } });
  }

  async deleteStay(data: DeleteStayDTO) {
    const stay = await this.stayRepository.findOne({ where: { id: data.id } });
    if (!stay) throw new HttpException(ErrorMsg.Resource_NotFound, HttpStatus.NOT_FOUND);

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
    return await this.stayApplyRepository.findOne({ where: { id: data.id } });
  }

  async createStayApply(data: CreateStayApplyDTO) {
    const target = await this.userRepository.findOne({ where: { id: data.user } });
    if (!target) throw new HttpException(ErrorMsg.Resource_NotFound, HttpStatus.NOT_FOUND);

    const stay = await this.stayRepository.findOne({ where: { id: data.stay } });
    if (!stay) throw new HttpException(ErrorMsg.Resource_NotFound, HttpStatus.NOT_FOUND);

    const exists = await this.stayApplyRepository.findOne({
      where: { stay_seat: data.stay_seat.toLowerCase() },
    });
    if (exists) throw new HttpException(ErrorMsg.ResourceAlreadyExists, HttpStatus.BAD_REQUEST);

    // teacher can force stay_seat. so, stay_seat will not be filtered.
    const stayApply = new StayApply();
    stayApply.stay_seat = data.stay_seat.toLowerCase();
    stayApply.user = target;
    stayApply.stay = stay;

    return await this.stayApplyRepository.save(stayApply);
  }

  async updateStayApply(data: UpdateStayApplyDTO) {
    const stayApply = await this.stayApplyRepository.findOne({ where: { id: data.id } });
    if (!stayApply) throw new HttpException(ErrorMsg.Resource_NotFound, HttpStatus.NOT_FOUND);

    const target = await this.userRepository.findOne({ where: { id: data.user } });
    if (!target) throw new HttpException(ErrorMsg.Resource_NotFound, HttpStatus.NOT_FOUND);

    const stay = await this.stayRepository.findOne({ where: { id: data.stay } });
    if (!stay) throw new HttpException(ErrorMsg.Resource_NotFound, HttpStatus.NOT_FOUND);

    const exists = await this.stayApplyRepository.findOne({
      where: { stay_seat: data.stay_seat.toLowerCase() },
    });
    if (exists) throw new HttpException(ErrorMsg.ResourceAlreadyExists, HttpStatus.BAD_REQUEST);

    stayApply.stay_seat = data.stay_seat.toLowerCase();
    stayApply.user = target;
    stayApply.stay = stay;

    return await this.stayApplyRepository.save(stayApply);
  }

  async deleteStayApply(data: StayApplyIdDTO) {
    const stayApply = await this.stayApplyRepository.findOne({ where: { id: data.id } });
    if (!stayApply) throw new HttpException(ErrorMsg.Resource_NotFound, HttpStatus.NOT_FOUND);

    return await this.stayApplyRepository.remove(stayApply);
  }

  // @Cron("0 0 * * *")
  // async syncStay() {
  //   const schedules = await this.stayScheduleRepository.find();
  // }
}
