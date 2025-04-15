import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FindOneOptions, LessThanOrEqual, MoreThanOrEqual, Repository } from "typeorm";

import { ErrorMsg } from "../../../common/mapper/error";
import { Grade, UserJWT } from "../../../common/mapper/types";
import { isInRange } from "../../../common/utils/staySeat.util";
import { Stay, StayApply, StayOuting, StaySeatPreset, User } from "../../../schemas";
import { CreateStayApplyDTO, StayApplyIdDTO, StayIdDTO } from "../dto/stay.dto";

@Injectable()
export class StayService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Stay)
    private readonly stayRepository: Repository<Stay>,
    @InjectRepository(StayApply)
    private readonly stayApplyRepository: Repository<StayApply>,
    @InjectRepository(StayOuting)
    private readonly stayOutingRepository: Repository<StayOuting>,
  ) {}

  // just give all stay?
  async getStayList(user: UserJWT) {
    return await this.stayRepository.find({
      where: {
        stay_apply_period: {
          grade: user.grade as Grade,
          apply_start: LessThanOrEqual(new Date().toISOString()),
          apply_end: MoreThanOrEqual(new Date().toISOString()),
        },
      },
    });
  }

  async getStayApplies(user: UserJWT) {
    return await this.stayApplyRepository.find({ where: { user: { id: user.id } } });
  }

  async createStayApply(user: UserJWT, data: CreateStayApplyDTO) {
    const target = await this.safeFindOne<User>(this.userRepository, { where: { id: user.id } });
    const stay = await this.safeFindOne<Stay>(this.stayRepository, {
      where: {
        id: data.stay,
        stay_apply_period: {
          grade: user.grade as Grade,
          apply_start: LessThanOrEqual(new Date().toISOString()),
          apply_end: MoreThanOrEqual(new Date().toISOString()),
        },
      },
    });

    const exists = await this.stayApplyRepository.findOne({
      where: { user: { id: user.id }, stay: stay },
    });
    if (exists) throw new HttpException(ErrorMsg.StaySeat_Duplication, HttpStatus.BAD_REQUEST);

    const staySeatCheck = await this.stayApplyRepository.findOne({
      where: { stay_seat: data.stay_seat.toUpperCase(), stay: stay },
    });
    if (staySeatCheck)
      throw new HttpException(ErrorMsg.StaySeat_Duplication, HttpStatus.BAD_REQUEST);

    if (!this.isAvailableSeat(user, stay.stay_seat_preset, data.stay_seat))
      throw new HttpException(ErrorMsg.StaySeat_NotAllowed, HttpStatus.BAD_REQUEST);

    const stayApply = new StayApply();
    stayApply.stay_seat = data.stay_seat.toUpperCase();
    stayApply.user = target;
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
      stayApply.outing.push(outing);
    }

    await this.stayOutingRepository.save(stayApply.outing);
    return await this.stayApplyRepository.save(stayApply);
  }

  async updateStayApply(user: UserJWT, data: CreateStayApplyDTO) {
    const dbUser = await this.safeFindOne<User>(this.userRepository, { where: { id: user.id } });
    const stayApply = await this.safeFindOne<StayApply>(this.stayApplyRepository, {
      where: { user: dbUser, stay: { id: data.stay } },
    });
    if (stayApply.user.id !== user.id)
      throw new HttpException(ErrorMsg.PermissionDenied_Resource, HttpStatus.FORBIDDEN);

    const exists = await this.stayApplyRepository.findOne({
      where: { stay_seat: data.stay_seat.toUpperCase(), stay: stayApply.stay },
    });
    if (exists && exists.id !== stayApply.id)
      throw new HttpException(ErrorMsg.StaySeat_Duplication, HttpStatus.BAD_REQUEST);

    if (!this.isAvailableSeat(user, stayApply.stay.stay_seat_preset, data.stay_seat))
      throw new HttpException(ErrorMsg.StaySeat_NotAllowed, HttpStatus.BAD_REQUEST);

    stayApply.stay_seat = data.stay_seat.toUpperCase();
    stayApply.user = dbUser;

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
      outing.audit_reason = null;
      outing.approved = null;
      stayApply.outing.push(outing);
    }

    await this.stayOutingRepository.save(stayApply.outing);
    return await this.stayApplyRepository.save(stayApply);
  }

  async deleteStayApply(user: UserJWT, data: StayIdDTO) {
    const stayApply = await this.safeFindOne<StayApply>(this.stayApplyRepository, {
      where: { stay: { id: data.id } },
    });
    if (stayApply.user.id !== user.id)
      throw new HttpException(ErrorMsg.PermissionDenied_Resource, HttpStatus.FORBIDDEN);

    return this.stayApplyRepository.remove(stayApply);
  }

  // pass if only_readingRoom false, pass if it's true and seat is in available range
  private isAvailableSeat(user: UserJWT, preset: StaySeatPreset, target: string) {
    return preset.stay_seat
      .filter((stay_seat) => stay_seat.target === `${user.grade}_${user.gender}`)
      .some(
        (range) =>
          (preset.only_readingRoom && isInRange(range.range.split(":"), target)) ||
          !preset.only_readingRoom,
      );
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

  // TODO: cron that removes expired stay apply over a month
}
