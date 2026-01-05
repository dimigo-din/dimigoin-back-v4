import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { format } from 'date-fns';

import { In, type Repository } from 'typeorm';
import { ErrorMsg } from '../../../common/mapper/error';
import { CacheService } from '../../../common/modules/cache.module';
import { safeFindOne } from '../../../common/utils/safeFindOne.util';
import {
  LaundryApply,
  LaundryMachine,
  LaundryTime,
  LaundryTimeline,
  Stay,
  User,
} from '../../../schemas';
import { PushManageService } from '../../push/providers';
import type {
  CreateLaundryApplyDTO,
  CreateLaundryMachineDTO,
  CreateLaundryTimelineDTO,
  LaundryApplyIdDTO,
  LaundryMachineIdDTO,
  LaundryTimelineIdDTO,
  UpdateLaundryApplyDTO,
  UpdateLaundryMachineDTO,
  UpdateLaundryTimelineDTO,
} from '../dto/laundry.manage.dto';

@Injectable()
export class LaundryManageService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Stay) readonly _stayRepository: Repository<Stay>,
    @InjectRepository(LaundryTime)
    private readonly laundryTimeRepository: Repository<LaundryTime>,
    @InjectRepository(LaundryApply)
    private readonly laundryApplyRepository: Repository<LaundryApply>,
    @InjectRepository(LaundryMachine)
    private readonly laundryMachineRepository: Repository<LaundryMachine>,
    @InjectRepository(LaundryTimeline)
    private readonly laundryTimelineRepository: Repository<LaundryTimeline>,
    readonly _pushManageService: PushManageService,
    readonly _cacheService: CacheService,
    readonly _moduleRef: ModuleRef,
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
    laundryTimeline.scheduler = data.scheduler;

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
    laundryTimeline.scheduler = data.scheduler;

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
      where: { laundryTimeline: { enabled: true }, date: format(new Date(), 'yyyy-MM-dd') },
      relations: { user: true, laundryMachine: true, laundryTime: true, laundryTimeline: true },
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
    if (applyExists) {
      throw new HttpException(
        ErrorMsg.LaundryApply_AlreadyExists(laundryMachine.type === 'washer' ? '세탁' : '건조'),
        HttpStatus.BAD_REQUEST,
      );
    }

    const machineTaken = await this.laundryApplyRepository.findOne({
      where: { laundryMachine: laundryMachine },
    });
    if (machineTaken) {
      throw new HttpException(ErrorMsg.LaundryMachine_AlreadyTaken(), HttpStatus.BAD_REQUEST);
    }

    const date = format(new Date(), 'yyyy-MM-dd');

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
}
