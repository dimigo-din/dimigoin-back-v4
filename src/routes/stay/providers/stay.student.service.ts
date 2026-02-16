import { HttpException, HttpStatus, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { isEqual } from "date-fns";
import { eq } from "drizzle-orm";
import { stayApply, stayOuting } from "#/db/schema";
import { SelfDevelopment_Outing_From, SelfDevelopment_Outing_To } from "$mapper/constants";
import { ErrorMsg } from "$mapper/error";
import type { Gender, Grade, UserJWT } from "$mapper/types";
import { DRIZZLE, type DrizzleDB } from "$modules/drizzle.module";
import { findOrThrow } from "$utils/findOrThrow.util";
import { isInRange, isInValidRange } from "$utils/staySeat.util";
import { andWhere } from "$utils/where.util";
import {
  AddStayOutingDTO,
  CreateUserStayApplyDTO,
  EditStayOutingDTO,
  GetStayListDTO,
  StayIdDTO,
  StayOutingIdDTO,
} from "~stay/dto/stay.student.dto";
import { UserManageService } from "~user/providers";

@Injectable()
export class StayStudentService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly userManageService: UserManageService,
  ) {}

  async getStayList(userJwt: UserJWT, _data: GetStayListDTO) {
    const stays = await this.db.query.stay.findMany({
      with: {
        stayApplyPeriodStay: true,
        stayApply: {
          with: {
            user: true,
          },
        },
        staySeatPreset: {
          with: {
            staySeatPresetRange: true,
          },
        },
      },
      orderBy: (stay, { asc }) => [asc(stay.stay_from)],
    });

    return stays.map((s) => ({
      id: s.id,
      name: s.name,
      stay_from: s.stay_from,
      stay_to: s.stay_to,
      outing_day: s.outing_day,
      stay_seat_preset: s.staySeatPreset
        ? {
            ...s.staySeatPreset,
            stay_seat: s.staySeatPreset.staySeatPresetRange,
          }
        : null,
      stay_apply_period: s.stayApplyPeriodStay,
      stay_apply: s.stayApply
        .filter(
          (sa): sa is (typeof s.stayApply)[number] & { user: { id: string; name: string } } =>
            !!sa.user,
        )
        .map((sa) => ({
          ...(userJwt.id === sa.user.id ? { id: sa.id } : {}),
          stay_seat: sa.stay_seat,
          user: { id: sa.user.id, name: sa.user.name },
        })),
    }));
  }

  async getStayApplies(userJwt: UserJWT) {
    return await this.db.query.stayApply.findMany({
      where: { RAW: (t, { eq }) => eq(t.userId, userJwt.id) },
      with: {
        stay: true,
      },
    });
  }

  async createStayApply(userJwt: UserJWT, data: CreateUserStayApplyDTO) {
    await findOrThrow(
      this.db.query.user.findFirst({ where: { RAW: (t, { eq }) => eq(t.id, userJwt.id) } }),
    );

    const now = new Date();
    const stayRow = await findOrThrow(
      this.db.query.stay.findFirst({
        where: { RAW: (t, { eq }) => eq(t.id, data.stay) },
        with: {
          stayApplyPeriodStay: true,
          staySeatPreset: {
            with: {
              staySeatPresetRange: true,
            },
          },
        },
      }),
    );

    // Validate apply period
    const validPeriod = stayRow.stayApplyPeriodStay?.find(
      (p: { grade: number; apply_start: Date; apply_end: Date }) =>
        p.grade === Number(data.grade) &&
        new Date(p.apply_start) <= now &&
        new Date(p.apply_end) >= now,
    );
    if (!validPeriod) {
      throw new HttpException(ErrorMsg.Stay_NotInApplyPeriod(), HttpStatus.NOT_FOUND);
    }

    const exists = await this.db.query.stayApply.findFirst({
      where: {
        RAW: (t, { and, eq }) => andWhere(and, eq(t.userId, userJwt.id), eq(t.stayId, data.stay)),
      },
    });
    if (exists) {
      throw new HttpException(ErrorMsg.Stay_AlreadyApplied(), HttpStatus.BAD_REQUEST);
    }

    const staySeatCheck = await this.db.query.stayApply.findFirst({
      where: {
        RAW: (t, { and, eq }) =>
          andWhere(and, eq(t.stay_seat, data.stay_seat.toUpperCase()), eq(t.stayId, data.stay)),
      },
    });
    if (staySeatCheck && isInValidRange(staySeatCheck.stay_seat)) {
      throw new HttpException(ErrorMsg.StaySeat_Duplication(), HttpStatus.BAD_REQUEST);
    }

    const presetForSeat = stayRow.staySeatPreset
      ? {
          ...stayRow.staySeatPreset,
          stay_seat: stayRow.staySeatPreset.staySeatPresetRange,
        }
      : null;

    if (
      !(await this.isAvailableSeat(userJwt, presetForSeat, data.stay_seat, data.grade, data.gender))
    ) {
      throw new HttpException(ErrorMsg.StaySeat_NotAllowed(), HttpStatus.BAD_REQUEST);
    }

    const [savedApply] = await this.db
      .insert(stayApply)
      .values({
        stay_seat: data.stay_seat.toUpperCase(),
        userId: userJwt.id,
        stayId: data.stay,
      })
      .returning();

    if (!savedApply) {
      throw new HttpException(ErrorMsg.Resource_NotFound(), HttpStatus.NOT_FOUND);
    }

    const outingValues: (typeof stayOuting.$inferInsert)[] = [];
    for (const outingData of data.outing) {
      const approved =
        (outingData.reason === "자기계발외출" &&
          !outingData.breakfast_cancel &&
          !outingData.dinner_cancel &&
          stayRow.outing_day.every((d: string) =>
            isEqual(new Date(SelfDevelopment_Outing_From(d)), new Date(outingData.from)),
          ) &&
          stayRow.outing_day.every((d: string) =>
            isEqual(new Date(SelfDevelopment_Outing_To(d)), new Date(outingData.to)),
          )) ||
        null;

      outingValues.push({
        reason: outingData.reason,
        breakfast_cancel: outingData.breakfast_cancel,
        lunch_cancel: outingData.lunch_cancel,
        dinner_cancel: outingData.dinner_cancel,
        from: outingData.from,
        to: outingData.to,
        approved,
        stayApplyId: savedApply.id,
      });
    }

    if (outingValues.length > 0) {
      await this.db.insert(stayOuting).values(outingValues);
    }

    return await findOrThrow(
      this.db.query.stayApply.findFirst({ where: { RAW: (t, { eq }) => eq(t.id, savedApply.id) } }),
    );
  }

  async updateStayApply(userJwt: UserJWT, data: CreateUserStayApplyDTO) {
    await findOrThrow(
      this.db.query.user.findFirst({ where: { RAW: (t, { eq }) => eq(t.id, userJwt.id) } }),
    );

    const existing = await findOrThrow(
      this.db.query.stayApply.findFirst({
        where: {
          RAW: (t, { and, eq }) => andWhere(and, eq(t.userId, userJwt.id), eq(t.stayId, data.stay)),
        },
        with: {
          stay: {
            with: {
              stayApplyPeriodStay: true,
              staySeatPreset: {
                with: {
                  staySeatPresetRange: true,
                },
              },
            },
          },
          user: true,
          outing: true,
        },
      }),
    );

    if (!existing.stay) {
      throw new HttpException(ErrorMsg.Resource_NotFound(), HttpStatus.NOT_FOUND);
    }
    const stay = existing.stay;

    if (existing?.user?.id !== userJwt.id) {
      throw new HttpException(ErrorMsg.PermissionDenied_Resource(), HttpStatus.FORBIDDEN);
    }

    if (!(await this.validateStayPeriod(userJwt, data.grade, stay.stayApplyPeriodStay))) {
      throw new HttpException(ErrorMsg.Stay_NotInApplyPeriod(), HttpStatus.FORBIDDEN);
    }

    const staySeatCheck = await this.db.query.stayApply.findFirst({
      where: {
        RAW: (t, { and, eq }) =>
          andWhere(and, eq(t.stay_seat, data.stay_seat.toUpperCase()), eq(t.stayId, stay.id)),
      },
    });
    if (
      staySeatCheck &&
      staySeatCheck.id !== existing.id &&
      isInValidRange(staySeatCheck.stay_seat)
    ) {
      throw new HttpException(ErrorMsg.StaySeat_Duplication(), HttpStatus.BAD_REQUEST);
    }

    const presetForSeat = stay.staySeatPreset
      ? {
          ...stay.staySeatPreset,
          stay_seat: stay.staySeatPreset.staySeatPresetRange,
        }
      : null;

    if (
      !(await this.isAvailableSeat(userJwt, presetForSeat, data.stay_seat, data.grade, data.gender))
    ) {
      throw new HttpException(ErrorMsg.StaySeat_NotAllowed(), HttpStatus.BAD_REQUEST);
    }

    await this.db
      .update(stayApply)
      .set({
        stay_seat: data.stay_seat.toUpperCase(),
        userId: userJwt.id,
      })
      .where(eq(stayApply.id, existing.id));

    // Remove old outings and insert new ones
    await this.db.delete(stayOuting).where(eq(stayOuting.stayApplyId, existing.id));

    const outingValues: (typeof stayOuting.$inferInsert)[] = [];
    for (const outingData of data.outing) {
      const approved =
        (outingData.reason === "자기계발외출" &&
          !outingData.breakfast_cancel &&
          !outingData.dinner_cancel &&
          existing.stay.outing_day.every((d: string) =>
            isEqual(new Date(SelfDevelopment_Outing_From(d)), new Date(outingData.from)),
          ) &&
          existing.stay.outing_day.every((d: string) =>
            isEqual(new Date(SelfDevelopment_Outing_To(d)), new Date(outingData.to)),
          )) ||
        null;

      outingValues.push({
        reason: outingData.reason,
        breakfast_cancel: outingData.breakfast_cancel,
        lunch_cancel: outingData.lunch_cancel,
        dinner_cancel: outingData.dinner_cancel,
        from: outingData.from,
        to: outingData.to,
        audit_reason: null,
        approved,
        stayApplyId: existing.id,
      });
    }

    if (outingValues.length > 0) {
      await this.db.insert(stayOuting).values(outingValues);
    }

    return await findOrThrow(
      this.db.query.stayApply.findFirst({ where: { RAW: (t, { eq }) => eq(t.id, existing.id) } }),
    );
  }

  async deleteStayApply(userJwt: UserJWT, data: StayIdDTO) {
    const existing = await this.db.query.stayApply.findFirst({
      where: { RAW: (t, { eq }) => eq(t.id, data.id) },
      with: {
        stay: {
          with: {
            stayApplyPeriodStay: true,
          },
        },
        user: true,
      },
    });
    if (!existing) {
      throw new HttpException(ErrorMsg.Resource_NotFound(), HttpStatus.NOT_FOUND);
    }

    if (!existing.user || !existing.stay) {
      throw new HttpException(ErrorMsg.Resource_NotFound(), HttpStatus.NOT_FOUND);
    }

    if (existing.user.id !== userJwt.id) {
      throw new HttpException(ErrorMsg.PermissionDenied_Resource(), HttpStatus.FORBIDDEN);
    }

    if (!(await this.userManageService.checkUserDetail(userJwt.email, { grade: data.grade }))) {
      throw new HttpException(ErrorMsg.PermissionDenied_Resource(), HttpStatus.FORBIDDEN);
    }

    if (!(await this.validateStayPeriod(userJwt, data.grade, existing.stay.stayApplyPeriodStay))) {
      throw new HttpException(ErrorMsg.Stay_NotInApplyPeriod(), HttpStatus.FORBIDDEN);
    }

    const [deleted] = await this.db.delete(stayApply).where(eq(stayApply.id, data.id)).returning();
    return deleted;
  }

  async getStayOuting(userJwt: UserJWT, data: StayIdDTO) {
    await findOrThrow(
      this.db.query.user.findFirst({ where: { RAW: (t, { eq }) => eq(t.id, userJwt.id) } }),
    );

    return await this.db.query.stayOuting.findMany({
      where: { RAW: (t, { eq }) => eq(t.stayApplyId, data.id) },
    });
  }

  async addStayOuting(userJwt: UserJWT, data: AddStayOutingDTO) {
    await findOrThrow(
      this.db.query.user.findFirst({ where: { RAW: (t, { eq }) => eq(t.id, userJwt.id) } }),
    );

    const apply = await findOrThrow(
      this.db.query.stayApply.findFirst({
        where: { RAW: (t, { eq }) => eq(t.id, data.apply_id) },
        with: {
          stay: {
            with: {
              stayApplyPeriodStay: true,
            },
          },
          user: true,
        },
      }),
    );

    if (!apply.stay || !apply.user) {
      throw new HttpException(ErrorMsg.Resource_NotFound(), HttpStatus.NOT_FOUND);
    }

    // verification period
    if (!(await this.validateStayPeriod(userJwt, data.grade, apply.stay.stayApplyPeriodStay))) {
      throw new HttpException(ErrorMsg.Stay_NotInApplyPeriod(), HttpStatus.FORBIDDEN);
    }
    if (apply.user.id !== userJwt.id) {
      throw new HttpException(ErrorMsg.PermissionDenied_Resource(), HttpStatus.FORBIDDEN);
    }

    const approved =
      (data.outing.reason === "자기계발외출" &&
        !data.outing.breakfast_cancel &&
        !data.outing.dinner_cancel &&
        apply.stay.outing_day.every((d: string) =>
          isEqual(new Date(SelfDevelopment_Outing_From(d)), new Date(data.outing.from)),
        ) &&
        apply.stay.outing_day.every((d: string) =>
          isEqual(new Date(SelfDevelopment_Outing_To(d)), new Date(data.outing.to)),
        )) ||
      null;

    if (data.outing.from >= data.outing.to) {
      throw new HttpException(ErrorMsg.ProvidedTime_Invalid(), HttpStatus.BAD_REQUEST);
    }

    const [saved] = await this.db
      .insert(stayOuting)
      .values({
        reason: data.outing.reason,
        breakfast_cancel: data.outing.breakfast_cancel,
        lunch_cancel: data.outing.lunch_cancel,
        dinner_cancel: data.outing.dinner_cancel,
        from: data.outing.from,
        to: data.outing.to,
        audit_reason: null,
        approved,
        stayApplyId: apply.id,
      })
      .returning();

    if (!saved) {
      throw new HttpException(ErrorMsg.Resource_NotFound(), HttpStatus.NOT_FOUND);
    }

    return await findOrThrow(
      this.db.query.stayOuting.findFirst({ where: { RAW: (t, { eq }) => eq(t.id, saved.id) } }),
    );
  }

  async editStayOuting(userJwt: UserJWT, data: EditStayOutingDTO) {
    await findOrThrow(
      this.db.query.user.findFirst({ where: { RAW: (t, { eq }) => eq(t.id, userJwt.id) } }),
    );

    const outing = await findOrThrow(
      this.db.query.stayOuting.findFirst({
        where: { RAW: (t, { eq }) => eq(t.id, data.outing_id) },
        with: {
          stayApply: {
            with: {
              user: true,
              stay: {
                with: {
                  stayApplyPeriodStay: true,
                },
              },
            },
          },
        },
      }),
    );
    if (!outing.stayApply || !outing.stayApply.user || !outing.stayApply.stay) {
      throw new NotFoundException("Stay outing not found");
    }
    if (outing.stayApply.user.id !== userJwt.id) {
      throw new HttpException(ErrorMsg.PermissionDenied_Resource(), HttpStatus.FORBIDDEN);
    }

    // verification period
    if (
      !(await this.validateStayPeriod(
        userJwt,
        data.grade,
        outing.stayApply.stay.stayApplyPeriodStay,
      ))
    ) {
      throw new HttpException(ErrorMsg.Stay_NotInApplyPeriod(), HttpStatus.FORBIDDEN);
    }

    const approved =
      (data.outing.reason === "자기계발외출" &&
        !data.outing.breakfast_cancel &&
        !data.outing.dinner_cancel &&
        outing.stayApply.stay.outing_day.every((d: string) =>
          isEqual(new Date(SelfDevelopment_Outing_From(d)), new Date(data.outing.from)),
        ) &&
        outing.stayApply.stay.outing_day.every((d: string) =>
          isEqual(new Date(SelfDevelopment_Outing_To(d)), new Date(data.outing.to)),
        )) ||
      null;

    if (data.outing.from >= data.outing.to) {
      throw new HttpException(ErrorMsg.ProvidedTime_Invalid(), HttpStatus.BAD_REQUEST);
    }

    const [updated] = await this.db
      .update(stayOuting)
      .set({
        reason: data.outing.reason,
        breakfast_cancel: data.outing.breakfast_cancel,
        lunch_cancel: data.outing.lunch_cancel,
        dinner_cancel: data.outing.dinner_cancel,
        from: data.outing.from,
        to: data.outing.to,
        audit_reason: null,
        approved,
      })
      .where(eq(stayOuting.id, data.outing_id))
      .returning();

    if (!updated) {
      throw new HttpException(ErrorMsg.Resource_NotFound(), HttpStatus.NOT_FOUND);
    }

    return await findOrThrow(
      this.db.query.stayOuting.findFirst({ where: { RAW: (t, { eq }) => eq(t.id, updated.id) } }),
    );
  }

  async removeStayOuting(userJwt: UserJWT, data: StayOutingIdDTO) {
    await findOrThrow(
      this.db.query.user.findFirst({ where: { RAW: (t, { eq }) => eq(t.id, userJwt.id) } }),
    );

    const outing = await findOrThrow(
      this.db.query.stayOuting.findFirst({
        where: { RAW: (t, { eq }) => eq(t.id, data.id) },
        with: {
          stayApply: {
            with: {
              user: true,
              stay: {
                with: {
                  stayApplyPeriodStay: true,
                },
              },
            },
          },
        },
      }),
    );
    if (!outing.stayApply || !outing.stayApply.user || !outing.stayApply.stay) {
      throw new HttpException(ErrorMsg.Resource_NotFound(), HttpStatus.NOT_FOUND);
    }
    if (outing.stayApply.user.id !== userJwt.id) {
      throw new HttpException(ErrorMsg.PermissionDenied_Resource(), HttpStatus.FORBIDDEN);
    }

    if (
      !(await this.validateStayPeriod(
        userJwt,
        data.grade,
        outing.stayApply.stay.stayApplyPeriodStay,
      ))
    ) {
      throw new HttpException(ErrorMsg.Stay_NotInApplyPeriod(), HttpStatus.FORBIDDEN);
    }

    const [deleted] = await this.db
      .delete(stayOuting)
      .where(eq(stayOuting.id, data.id))
      .returning();
    return deleted;
  }

  // pass if only_readingRoom false, pass if it's true and seat is in available range
  async isAvailableSeat(
    userJwt: UserJWT,
    preset: {
      only_readingRoom: boolean;
      stay_seat: { target: string; range: string }[];
    } | null,
    target: string,
    grade: Grade,
    gender: Gender,
  ) {
    if (!preset || !preset.stay_seat || preset.stay_seat.length === 0) {
      return await this.userManageService.checkUserDetail(userJwt.email, { gender, grade });
    }
    return (
      preset.stay_seat
        .filter((seat: { target: string }) => seat.target === `${grade}_${gender}`)
        .some(
          (range: { range: string }) =>
            (preset.only_readingRoom && isInRange(range.range.split(":"), target)) ||
            !preset.only_readingRoom,
        ) && (await this.userManageService.checkUserDetail(userJwt.email, { gender, grade }))
    );
  }

  private async validateStayPeriod(
    userJwt: UserJWT,
    grade: Grade,
    stay_apply_period: { grade: number; apply_start: Date; apply_end: Date }[],
  ) {
    let isSame = true;
    let last = "";
    for (const period of stay_apply_period) {
      const startTime = new Date(period.apply_start).getTime().toString();
      const endTime = new Date(period.apply_end).getTime().toString();
      if (last === "") {
        last = startTime + endTime;
        continue;
      }
      if (last !== startTime + endTime) {
        isSame = false;
        break;
      }
      last = startTime + endTime;
    }

    if (!isSame) {
      const success = await this.userManageService.checkUserDetail(userJwt.email, {
        grade: grade,
      });
      if (!success) {
        throw new HttpException(ErrorMsg.PermissionDenied_Resource_Grade(), HttpStatus.FORBIDDEN);
      }
    }

    const now = new Date();
    const validPeriod = stay_apply_period.find(
      (p: { grade: number; apply_start: Date; apply_end: Date }) =>
        p.grade === Number(grade) && new Date(p.apply_start) <= now && new Date(p.apply_end) >= now,
    );

    return !!validPeriod;
  }
}
