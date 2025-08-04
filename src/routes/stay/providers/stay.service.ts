import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FindOneOptions, LessThanOrEqual, MoreThanOrEqual, Repository } from "typeorm";

import { ErrorMsg } from "../../../common/mapper/error";
import { Gender, Grade, UserJWT } from "../../../common/mapper/types";
import { safeFindOne } from "../../../common/utils/safeFindOne.util";
import { isInRange } from "../../../common/utils/staySeat.util";
import { Stay, StayApply, StayOuting, StaySeatPreset, User } from "../../../schemas";
import { UserManageService } from "../../user/providers";
import {
  AddStayOutingDTO,
  CreateUserStayApplyDTO,
  EditStayOutingDTO,
  GetStayListDTO,
  StayApplyIdDTO,
  StayIdDTO,
  StayOutingIdDTO,
} from "../dto/stay.dto";

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
    private readonly userManageService: UserManageService,
  ) {}

  // just give all stay?
  async getStayList(user: UserJWT, data: GetStayListDTO) {
    const now = new Date().toISOString();

    const stays = await this.stayRepository
      .createQueryBuilder("stay")
      .innerJoin(
        "stay.stay_apply_period",
        "stay_apply_period",
        "stay_apply_period.grade = :grade AND stay_apply_period.apply_start <= :now AND stay_apply_period.apply_end >= :now",
        { grade: data.grade, now },
      )
      .leftJoin("stay.stay_apply", "stay_apply")
      .leftJoin("stay_apply.user", "user")
      .leftJoin("stay.stay_seat_preset", "stay_seat_preset")
      .leftJoin("stay_seat_preset.stay_seat", "stay_seat")
      .select([
        "stay.id",
        "stay.name",
        "stay.stay_from",
        "stay.stay_to",
        "stay.outing_day",
        "stay_apply.id",
        "stay_apply.stay_seat",
        "stay_seat_preset",
        "stay_seat",
        "stay_apply_period",
        "user.id",
        "user.name",
      ])
      .getMany();

    return stays.map((stay) => ({
      id: stay.id,
      name: stay.name,
      stay_from: stay.stay_from,
      stay_to: stay.stay_to,
      outing_day: stay.outing_day,
      stay_seat_preset: stay.stay_seat_preset,
      stay_apply_period: stay.stay_apply_period,
      stay_apply: stay.stay_apply.map((stay_apply) => ({
        ...(user.id === stay_apply.user.id ? { id: stay_apply.id } : {}),
        stay_seat: stay_apply.stay_seat,
        user: { id: stay_apply.user.id, name: stay_apply.user.name },
      })),
    }));
  }

  async getStayApplies(user: UserJWT) {
    return await this.stayApplyRepository.find({ where: { user: { id: user.id } } });
  }

  async createStayApply(user: UserJWT, data: CreateUserStayApplyDTO) {
    const target = await safeFindOne<User>(this.userRepository, user.id);
    const stay = await safeFindOne<Stay>(this.stayRepository, {
      where: {
        id: data.stay,
        stay_apply_period: {
          grade: data.grade,
          apply_start: LessThanOrEqual(new Date().toISOString()),
          apply_end: MoreThanOrEqual(new Date().toISOString()),
        },
      },
    });

    const exists = await this.stayApplyRepository.findOne({
      where: { user: target, stay: { id: data.stay } },
    });
    if (exists) throw new HttpException(ErrorMsg.Stay_AlreadyApplied(), HttpStatus.BAD_REQUEST);

    const staySeatCheck = await this.stayApplyRepository.findOne({
      where: { stay_seat: data.stay_seat.toUpperCase(), stay: { id: data.stay } },
    });
    if (staySeatCheck)
      throw new HttpException(ErrorMsg.StaySeat_Duplication(), HttpStatus.BAD_REQUEST);

    if (
      !(await this.isAvailableSeat(
        user,
        stay.stay_seat_preset,
        data.stay_seat,
        data.grade,
        data.gender,
      ))
    )
      throw new HttpException(ErrorMsg.StaySeat_NotAllowed(), HttpStatus.BAD_REQUEST);

    const stayApply = new StayApply();
    stayApply.stay_seat = data.stay_seat.toUpperCase();
    stayApply.user = target;
    stayApply.stay = stay;

    stayApply.outing = [];
    for (const outingData of data.outing) {
      // TODO[high]: validate outing range
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

  async updateStayApply(user: UserJWT, data: CreateUserStayApplyDTO) {
    const dbUser = await safeFindOne<User>(this.userRepository, user.id);
    const stayApply = await safeFindOne<StayApply>(this.stayApplyRepository, {
      where: { user: dbUser, stay: { id: data.stay } },
    });
    if (stayApply.user.id !== user.id)
      throw new HttpException(ErrorMsg.PermissionDenied_Resource(), HttpStatus.FORBIDDEN);

    const staySeatCheck = await this.stayApplyRepository.findOne({
      where: { stay_seat: data.stay_seat.toUpperCase(), stay: { id: stayApply.stay.id } },
    });
    if (staySeatCheck && staySeatCheck.id !== stayApply.id)
      throw new HttpException(ErrorMsg.StaySeat_Duplication(), HttpStatus.BAD_REQUEST);

    if (
      !(await this.isAvailableSeat(
        user,
        stayApply.stay.stay_seat_preset,
        data.stay_seat,
        data.grade,
        data.gender,
      ))
    )
      throw new HttpException(ErrorMsg.StaySeat_NotAllowed(), HttpStatus.BAD_REQUEST);

    stayApply.stay_seat = data.stay_seat.toUpperCase();
    stayApply.user = dbUser;

    const outings = [];
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
      outings.push(outing);
    }

    await this.stayOutingRepository.remove(stayApply.outing);
    stayApply.outing = outings;
    await this.stayOutingRepository.save(stayApply.outing);
    return await this.stayApplyRepository.save(stayApply);
  }

  async deleteStayApply(user: UserJWT, data: StayIdDTO) {
    const stayApply = await safeFindOne<StayApply>(this.stayApplyRepository, data.id);
    if (stayApply.user.id !== user.id)
      throw new HttpException(ErrorMsg.PermissionDenied_Resource(), HttpStatus.FORBIDDEN);

    return this.stayApplyRepository.remove(stayApply);
  }

  async getStayOuting(user: UserJWT, data: StayIdDTO) {
    const target = await safeFindOne<User>(this.userRepository, user.id);

    return await this.stayOutingRepository.find({
      where: { stay_apply: { id: data.id, user: target } },
    });
  }

  async addStayOuting(user: UserJWT, data: AddStayOutingDTO) {
    const target = await safeFindOne<User>(this.userRepository, user.id);
    const apply = await safeFindOne<StayApply>(this.stayApplyRepository, data.apply_id);

    console.log(apply.user.id);
    if (apply.user.id !== target.id)
      throw new HttpException(ErrorMsg.PermissionDenied_Resource(), HttpStatus.FORBIDDEN);

    const outing = new StayOuting();
    outing.reason = data.outing.reason;
    outing.breakfast_cancel = data.outing.breakfast_cancel;
    outing.lunch_cancel = data.outing.lunch_cancel;
    outing.dinner_cancel = data.outing.dinner_cancel;
    outing.from = data.outing.from;
    outing.to = data.outing.to;
    outing.audit_reason = null;
    outing.approved = null;
    outing.stay_apply = apply;

    return await this.stayOutingRepository.save(outing);
  }

  async editStayOuting(user: UserJWT, data: EditStayOutingDTO) {
    const target = await safeFindOne<User>(this.userRepository, user.id);
    const outing = await safeFindOne<StayOuting>(this.stayOutingRepository, {
      where: { id: data.outing_id },
      relations: { stay_apply: { user: true } },
      loadEagerRelations: false,
    });

    console.log(outing.stay_apply.user.id);
    if (outing.stay_apply.user.id !== target.id)
      throw new HttpException(ErrorMsg.PermissionDenied_Resource(), HttpStatus.FORBIDDEN);

    outing.reason = data.outing.reason;
    outing.breakfast_cancel = data.outing.breakfast_cancel;
    outing.lunch_cancel = data.outing.lunch_cancel;
    outing.dinner_cancel = data.outing.dinner_cancel;
    outing.from = data.outing.from;
    outing.to = data.outing.to;
    outing.audit_reason = null;
    outing.approved = null;

    return await this.stayOutingRepository.save(outing);
  }

  async removeStayOuting(user: UserJWT, data: StayOutingIdDTO) {
    const target = await safeFindOne<User>(this.userRepository, user.id);
    const outing = await safeFindOne<StayOuting>(this.stayOutingRepository, {
      where: { id: data.id },
      relations: { stay_apply: { user: true } },
      loadEagerRelations: false,
    });

    console.log(outing.stay_apply.user.id);
    if (outing.stay_apply.user.id !== target.id)
      throw new HttpException(ErrorMsg.PermissionDenied_Resource(), HttpStatus.FORBIDDEN);

    return await this.stayOutingRepository.remove(outing);
  }

  // pass if only_readingRoom false, pass if it's true and seat is in available range
  private async isAvailableSeat(
    user: UserJWT,
    preset: StaySeatPreset,
    target: string,
    grade: Grade,
    gender: Gender,
  ) {
    return (
      preset.stay_seat
        .filter((stay_seat) => stay_seat.target === `${grade}_${gender}`)
        .some(
          (range) =>
            (preset.only_readingRoom && isInRange(range.range.split(":"), target)) ||
            !preset.only_readingRoom,
        ) && (await this.userManageService.checkUserDetail(user.email, { gender, grade }))
    );
  }
}
