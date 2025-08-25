import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import * as moment from "moment";
import { FindOneOptions, LessThanOrEqual, MoreThanOrEqual, Repository } from "typeorm";

import {
  SelfDevelopment_Outing_From,
  SelfDevelopment_Outing_To,
} from "../../../common/mapper/constants";
import { ErrorMsg } from "../../../common/mapper/error";
import { Gender, Grade, UserJWT } from "../../../common/mapper/types";
import { safeFindOne } from "../../../common/utils/safeFindOne.util";
import { isInRange } from "../../../common/utils/staySeat.util";
import { Stay, StayApply, StayOuting, StaySeatPreset, User, StayApplyPeriod_Stay } from "../../../schemas";
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
        "stay_apply_period"
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
      .orderBy("stay.stay_from", "ASC")
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
    return await this.stayApplyRepository.find({
      where: { user: { id: user.id } },
      relations: { stay: true },
    });
  }

  async createStayApply(user: UserJWT, data: CreateUserStayApplyDTO) {
    const target = await safeFindOne<User>(this.userRepository, user.id);
    
    const stay = await this.stayRepository.findOne({
      where: {
        id: data.stay,
        stay_apply_period: {
          grade: data.grade,
          apply_start: LessThanOrEqual(new Date()),
          apply_end: MoreThanOrEqual(new Date()),
        },
      },
    });
    if (!stay) throw new HttpException(ErrorMsg.Stay_NotInApplyPeriod(), HttpStatus.NOT_FOUND);

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
      outing.stay_apply = stayApply;
      outing.approved =
        (outingData.reason === "자기계발외출" &&
          !outingData.breakfast_cancel &&
          !outingData.dinner_cancel &&
          stay.outing_day.every((d) =>
            moment(SelfDevelopment_Outing_From(d)).isSame(outingData.from),
          ) &&
          stay.outing_day.every((d) =>
            moment(SelfDevelopment_Outing_To(d)).isSame(outingData.to),
          )) ||
        null;

      stayApply.outing.push(outing);
    }

    const saved = await this.stayApplyRepository.save(stayApply);
    return await safeFindOne<StayApply>(this.stayApplyRepository, saved.id);
  }

  async updateStayApply(user: UserJWT, data: CreateUserStayApplyDTO) {
    const dbUser = await safeFindOne<User>(this.userRepository, user.id);
    const stayApply = await safeFindOne<StayApply>(this.stayApplyRepository, {
      where: { user: dbUser, stay: { id: data.stay } },
      relations: { stay: true },
    });
    if (stayApply.user.id !== user.id)
      throw new HttpException(ErrorMsg.PermissionDenied_Resource(), HttpStatus.FORBIDDEN);

    if (!await this.validateStayPeriod(data.grade, stayApply.stay.stay_apply_period)) {
      throw new HttpException(ErrorMsg.Stay_NotInApplyPeriod(), HttpStatus.FORBIDDEN);
    }

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
      outing.stay_apply = stayApply;
      outing.approved =
        (outingData.reason === "자기계발외출" &&
          !outingData.breakfast_cancel &&
          !outingData.dinner_cancel &&
          stayApply.stay.outing_day.every((d) =>
            moment(SelfDevelopment_Outing_From(d)).isSame(outingData.from),
          ) &&
          stayApply.stay.outing_day.every((d) =>
            moment(SelfDevelopment_Outing_To(d)).isSame(outingData.to),
          )) ||
        null;

      outings.push(outing);
    }

    await this.stayOutingRepository.remove(stayApply.outing);
    stayApply.outing = outings;
    const saved = await this.stayApplyRepository.save(stayApply);
    return await safeFindOne<StayApply>(this.stayApplyRepository, saved.id);
  }

  async deleteStayApply(user: UserJWT, data: StayIdDTO) {
    const now = new Date();

    const stayApply = await this.stayApplyRepository.findOne({
      where: { id: data.id },
      relations: ["stay", "stay.stay_apply_period"],
    });
    if (!stayApply) throw new HttpException(ErrorMsg.Resource_NotFound(), HttpStatus.NOT_FOUND );

    if (stayApply.user.id !== user.id) throw new HttpException(ErrorMsg.PermissionDenied_Resource(), HttpStatus.FORBIDDEN);

    if(!this.userManageService.checkUserDetail(user.email, { grade: data.grade }))
      throw new HttpException(ErrorMsg.PermissionDenied_Resource(), HttpStatus.FORBIDDEN);

    if (!await this.validateStayPeriod(data.grade, stayApply.stay.stay_apply_period)) {
      throw new HttpException(
        ErrorMsg.Stay_NotInApplyPeriod(),
        HttpStatus.FORBIDDEN
      );
    }

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
    const apply = await safeFindOne<StayApply>(this.stayApplyRepository, {
      where: {
        id: data.apply_id,
      },
      relations: { stay: true },
    });

    // verification period
    if (!await this.validateStayPeriod(data.grade, apply.stay.stay_apply_period)) {
      throw new HttpException(
        ErrorMsg.Stay_NotInApplyPeriod(),
        HttpStatus.FORBIDDEN
      );
    }

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
    outing.stay_apply = apply;
    outing.approved =
      (data.outing.reason === "자기계발외출" &&
        !data.outing.breakfast_cancel &&
        !data.outing.dinner_cancel &&
        apply.stay.outing_day.every((d) =>
          moment(SelfDevelopment_Outing_From(d)).isSame(data.outing.from),
        ) &&
        apply.stay.outing_day.every((d) =>
          moment(SelfDevelopment_Outing_To(d)).isSame(data.outing.to),
        )) ||
      null;
    
    if(outing.from >= outing.to) {
      throw new HttpException(ErrorMsg.ProvidedTime_Invalid(), HttpStatus.BAD_REQUEST);
    }

    const saved = await this.stayOutingRepository.save(outing);
    return await safeFindOne<StayOuting>(this.stayOutingRepository, saved.id);
  }

  async editStayOuting(user: UserJWT, data: EditStayOutingDTO) {
    const target = await safeFindOne<User>(this.userRepository, user.id);
    const outing = await safeFindOne<StayOuting>(this.stayOutingRepository, {
      where: { id: data.outing_id },
      relations: { stay_apply: { user: true, stay: { stay_apply_period: true } } },
      loadEagerRelations: false,
    });

    
    console.log(outing.stay_apply.user.id);
    if (outing.stay_apply.user.id !== target.id)
      throw new HttpException(ErrorMsg.PermissionDenied_Resource(), HttpStatus.FORBIDDEN);

    // verification period
    if (!await this.validateStayPeriod(data.grade, outing.stay_apply.stay.stay_apply_period)) {
      throw new HttpException(
        ErrorMsg.Stay_NotInApplyPeriod(),
        HttpStatus.FORBIDDEN
      );
    }

    outing.reason = data.outing.reason;
    outing.breakfast_cancel = data.outing.breakfast_cancel;
    outing.lunch_cancel = data.outing.lunch_cancel;
    outing.dinner_cancel = data.outing.dinner_cancel;
    outing.from = data.outing.from;
    outing.to = data.outing.to;
    outing.audit_reason = null;
    outing.approved =
      (data.outing.reason === "자기계발외출" &&
        !data.outing.breakfast_cancel &&
        !data.outing.dinner_cancel &&
        outing.stay_apply.stay.outing_day.every((d) =>
          moment(SelfDevelopment_Outing_From(d)).isSame(data.outing.from),
        ) &&
        outing.stay_apply.stay.outing_day.every((d) =>
          moment(SelfDevelopment_Outing_To(d)).isSame(data.outing.to),
        )) ||
      null;
    
    if(outing.from >= outing.to) {
      throw new HttpException(ErrorMsg.ProvidedTime_Invalid(), HttpStatus.BAD_REQUEST);
    }

    const saved = await this.stayOutingRepository.save(outing);
    return await safeFindOne<StayOuting>(this.stayOutingRepository, saved.id);
  }

  async removeStayOuting(user: UserJWT, data: StayOutingIdDTO) {
    const target = await safeFindOne<User>(this.userRepository, user.id);
    const outing = await safeFindOne<StayOuting>(this.stayOutingRepository, {
      where: { id: data.id },
      relations: { stay_apply: { user: true, stay: { stay_apply_period: true } } },
      loadEagerRelations: false,
    });
    
    console.log(outing.stay_apply.user.id);
    if (outing.stay_apply.user.id !== target.id)
      throw new HttpException(ErrorMsg.PermissionDenied_Resource(), HttpStatus.FORBIDDEN);

    // verification period
    if (!await this.validateStayPeriod(data.grade, outing.stay_apply.stay.stay_apply_period)) {
      throw new HttpException(
        ErrorMsg.Stay_NotInApplyPeriod(),
        HttpStatus.FORBIDDEN
      );
    }
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

  private async validateStayPeriod(grade: Grade, stay_apply_period: StayApplyPeriod_Stay[]) {
    const now = new Date();
    const validPeriod = stay_apply_period.find(
      (p) =>
        p.grade === Number(grade) &&
        p.apply_start <= now &&
        p.apply_end >= now
    );

    return !!validPeriod;
  }
}
