import { TZDate } from "@date-fns/tz";
import { HttpException, HttpStatus, Inject, Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import {
  addDays,
  addWeeks,
  format,
  getDay,
  isBefore,
  isWithinInterval,
  max,
  setDay,
  setHours,
  setMinutes,
  setSeconds,
  startOfDay,
  subSeconds,
} from "date-fns";
import { eq, inArray } from "drizzle-orm";
import {
  stay,
  stayApply,
  stayApplyPeriodStay,
  stayApplyPeriodStaySchedule,
  stayOuting,
  staySchedule,
  staySeatPreset,
  staySeatPresetRange,
} from "#/db/schema";
import {
  stayApplyWithUserAndOuting,
  stayScheduleWithPresetAndApplyPeriod,
  stayScheduleWithSeatPresetAndPeriod,
  staySeatPresetWithRange,
  stayWithApplyAndOuting,
  stayWithParentAndApplyPeriod,
  stayWithPresetAndApplyPeriod,
} from "#/db/with";
import { ErrorMsg } from "$mapper/error";
import { DRIZZLE, type DrizzleDB } from "$modules/drizzle.module";
import { findOrThrow } from "$utils/findOrThrow.util";
import { softDelete } from "$utils/softDelete.util";
import { isInValidRange } from "$utils/staySeat.util";
import { andWhere } from "$utils/where.util";
import {
  AuditOutingDTO,
  CreateStayApplyDTO,
  CreateStayDTO,
  CreateStayScheduleDTO,
  CreateStaySeatPresetDTO,
  DeleteStayDTO,
  MoveToSomewhereDTO,
  StayApplyIdDTO,
  StayIdDTO,
  StayScheduleIdDTO,
  StaySeatPresetIdDTO,
  UpdateOutingMealCancelDTO,
  UpdateStayApplyDTO,
  UpdateStayDTO,
  UpdateStayScheduleDTO,
  UpdateStaySeatPresetDTO,
} from "~stay/dto/stay.manage.dto";

@Injectable()
export class StayManageService {
  private logger = new Logger(StayManageService.name);
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async getStaySeatPresetList() {
    const presets = await this.db.query.staySeatPreset.findMany();
    return presets.map((p) => {
      return { id: p.id, name: p.name };
    });
  }

  async getStaySeatPreset(data: StaySeatPresetIdDTO) {
    return await findOrThrow(
      this.db.query.staySeatPreset.findFirst({
        where: { RAW: (t, { eq }) => eq(t.id, data.id) },
        with: staySeatPresetWithRange,
      }),
    );
  }

  async createStaySeatPreset(data: CreateStaySeatPresetDTO) {
    const [saved] = await this.db
      .insert(staySeatPreset)
      .values({
        name: data.name,
        only_readingRoom: data.only_readingRoom,
      })
      .returning();

    if (!saved) {
      throw new HttpException(ErrorMsg.Resource_NotFound(), HttpStatus.NOT_FOUND);
    }

    const rangeValues: (typeof staySeatPresetRange.$inferInsert)[] = [];
    for (const mappings of data.mappings) {
      for (const range of mappings.ranges) {
        rangeValues.push({
          target: mappings.target,
          range: range,
          staySeatPresetId: saved.id,
        });
      }
    }

    if (rangeValues.length > 0) {
      await this.db.insert(staySeatPresetRange).values(rangeValues);
    }

    return await findOrThrow(
      this.db.query.staySeatPreset.findFirst({
        where: { RAW: (t, { eq }) => eq(t.id, saved.id) },
        with: staySeatPresetWithRange,
      }),
    );
  }

  async updateStaySeatPreset(data: UpdateStaySeatPresetDTO) {
    await findOrThrow(
      this.db.query.staySeatPreset.findFirst({
        where: { RAW: (t, { eq }) => eq(t.id, data.id) },
      }),
    );

    await this.db
      .update(staySeatPreset)
      .set({ name: data.name, only_readingRoom: data.only_readingRoom })
      .where(eq(staySeatPreset.id, data.id));

    // Remove old ranges and insert new ones
    await this.db
      .delete(staySeatPresetRange)
      .where(eq(staySeatPresetRange.staySeatPresetId, data.id));

    const rangeValues: (typeof staySeatPresetRange.$inferInsert)[] = [];
    for (const mappings of data.mappings) {
      for (const range of mappings.ranges) {
        rangeValues.push({
          target: mappings.target,
          range: range,
          staySeatPresetId: data.id,
        });
      }
    }

    if (rangeValues.length > 0) {
      await this.db.insert(staySeatPresetRange).values(rangeValues);
    }

    return await findOrThrow(
      this.db.query.staySeatPreset.findFirst({
        where: { RAW: (t, { eq }) => eq(t.id, data.id) },
        with: staySeatPresetWithRange,
      }),
    );
  }

  async deleteStaySeatPreset(data: StaySeatPresetIdDTO) {
    const target = await findOrThrow(
      this.db.query.staySeatPreset.findFirst({
        where: { RAW: (t, { eq }) => eq(t.id, data.id) },
        with: staySeatPresetWithRange,
      }),
    );
    await this.db.delete(staySeatPreset).where(eq(staySeatPreset.id, data.id));
    return target;
  }

  async getStayScheduleList() {
    const schedules = await this.db.query.staySchedule.findMany();
    return schedules.map((e) => {
      return { id: e.id, name: e.name };
    });
  }

  async getStaySchedule(data: StayScheduleIdDTO) {
    return await this.db.query.staySchedule.findFirst({
      where: { RAW: (t, { eq }) => eq(t.id, data.id) },
      with: stayScheduleWithPresetAndApplyPeriod,
    });
  }

  async createStaySchedule(data: CreateStayScheduleDTO) {
    const preset = await this.db.query.staySeatPreset.findFirst({
      where: { RAW: (t, { eq }) => eq(t.id, data.staySeatPreset) },
    });
    if (!preset) {
      throw new HttpException(ErrorMsg.Resource_NotFound(), HttpStatus.NOT_FOUND);
    }

    const [saved] = await this.db
      .insert(staySchedule)
      .values({
        name: data.name,
        stay_from: data.stay_from,
        stay_to: data.stay_to,
        outing_day: data.outing_day,
        staySeatPresetId: preset.id,
      })
      .returning();

    if (!saved) {
      throw new HttpException(ErrorMsg.Resource_NotFound(), HttpStatus.NOT_FOUND);
    }

    const periodValues: (typeof stayApplyPeriodStaySchedule.$inferInsert)[] = [];
    for (const period of data.stayApplyPeriod) {
      periodValues.push({
        grade: period.grade,
        apply_start_day: period.apply_start_day,
        apply_start_hour: period.apply_start_hour,
        apply_end_day: period.apply_end_day,
        apply_end_hour: period.apply_end_hour,
        stayScheduleId: saved.id,
      });
    }

    if (periodValues.length > 0) {
      await this.db.insert(stayApplyPeriodStaySchedule).values(periodValues);
    }

    return await findOrThrow(
      this.db.query.staySchedule.findFirst({
        where: { RAW: (t, { eq }) => eq(t.id, saved.id) },
        with: stayScheduleWithPresetAndApplyPeriod,
      }),
    );
  }

  async updateStaySchedule(data: UpdateStayScheduleDTO) {
    const preset = await this.db.query.staySeatPreset.findFirst({
      where: { RAW: (t, { eq }) => eq(t.id, data.staySeatPreset) },
    });
    if (!preset) {
      throw new HttpException(ErrorMsg.Resource_NotFound(), HttpStatus.NOT_FOUND);
    }

    await findOrThrow(
      this.db.query.staySchedule.findFirst({
        where: { RAW: (t, { eq }) => eq(t.id, data.id) },
      }),
    );

    await this.db
      .update(staySchedule)
      .set({
        name: data.name,
        stay_from: data.stay_from,
        stay_to: data.stay_to,
        outing_day: data.outing_day,
        staySeatPresetId: preset.id,
      })
      .where(eq(staySchedule.id, data.id));

    // Remove old periods and insert new ones
    await this.db
      .delete(stayApplyPeriodStaySchedule)
      .where(eq(stayApplyPeriodStaySchedule.stayScheduleId, data.id));

    const periodValues: (typeof stayApplyPeriodStaySchedule.$inferInsert)[] = [];
    for (const period of data.stayApplyPeriod) {
      periodValues.push({
        grade: period.grade,
        apply_start_day: period.apply_start_day,
        apply_start_hour: period.apply_start_hour,
        apply_end_day: period.apply_end_day,
        apply_end_hour: period.apply_end_hour,
        stayScheduleId: data.id,
      });
    }

    if (periodValues.length > 0) {
      await this.db.insert(stayApplyPeriodStaySchedule).values(periodValues);
    }

    return await findOrThrow(
      this.db.query.staySchedule.findFirst({
        where: { RAW: (t, { eq }) => eq(t.id, data.id) },
        with: stayScheduleWithPresetAndApplyPeriod,
      }),
    );
  }

  async deleteStaySchedule(data: StayScheduleIdDTO) {
    const target = await findOrThrow(
      this.db.query.staySchedule.findFirst({
        where: { RAW: (t, { eq }) => eq(t.id, data.id) },
        with: stayScheduleWithPresetAndApplyPeriod,
      }),
    );
    await this.db.delete(staySchedule).where(eq(staySchedule.id, data.id));
    return target;
  }

  async getStayList() {
    const stays = await this.db.query.stay.findMany();
    return stays.map((e) => {
      return { id: e.id, name: e.name, stay_from: e.stay_from, stay_to: e.stay_to };
    });
  }

  async getStay(data: StayIdDTO) {
    return await this.db.query.stay.findFirst({
      where: { RAW: (t, { eq }) => eq(t.id, data.id) },
      with: stayWithPresetAndApplyPeriod,
    });
  }

  async createStay(data: CreateStayDTO) {
    const preset = await this.db.query.staySeatPreset.findFirst({
      where: { RAW: (t, { eq }) => eq(t.id, data.seat_preset) },
    });
    if (!preset) {
      throw new HttpException(ErrorMsg.Resource_NotFound(), HttpStatus.NOT_FOUND);
    }

    const [saved] = await this.db
      .insert(stay)
      .values({
        name: data.name,
        stay_from: data.from,
        stay_to: data.to,
        outing_day: data.outing_day,
        staySeatPresetId: preset.id,
      })
      .returning();

    if (!saved) {
      throw new HttpException(ErrorMsg.Resource_NotFound(), HttpStatus.NOT_FOUND);
    }

    const periodValues: (typeof stayApplyPeriodStay.$inferInsert)[] = [];
    for (const period of data.period) {
      periodValues.push({
        grade: period.grade,
        apply_start: new Date(period.start),
        apply_end: new Date(period.end),
        stayId: saved.id,
      });
    }

    if (periodValues.length > 0) {
      await this.db.insert(stayApplyPeriodStay).values(periodValues);
    }

    return await findOrThrow(
      this.db.query.stay.findFirst({
        where: { RAW: (t, { eq }) => eq(t.id, saved.id) },
        with: stayWithPresetAndApplyPeriod,
      }),
    );
  }

  async updateStay(data: UpdateStayDTO) {
    await findOrThrow(
      this.db.query.stay.findFirst({ where: { RAW: (t, { eq }) => eq(t.id, data.id) } }),
    );

    const preset = await this.db.query.staySeatPreset.findFirst({
      where: { RAW: (t, { eq }) => eq(t.id, data.seat_preset) },
    });
    if (!preset) {
      throw new HttpException(ErrorMsg.Resource_NotFound(), HttpStatus.NOT_FOUND);
    }

    await this.db
      .update(stay)
      .set({
        name: data.name,
        stay_from: data.from,
        stay_to: data.to,
        staySeatPresetId: preset.id,
      })
      .where(eq(stay.id, data.id));

    // Remove old periods and insert new ones
    await this.db.delete(stayApplyPeriodStay).where(eq(stayApplyPeriodStay.stayId, data.id));

    const periodValues: (typeof stayApplyPeriodStay.$inferInsert)[] = [];
    for (const period of data.period) {
      periodValues.push({
        grade: period.grade,
        apply_start: new Date(period.start),
        apply_end: new Date(period.end),
        stayId: data.id,
      });
    }

    if (periodValues.length > 0) {
      await this.db.insert(stayApplyPeriodStay).values(periodValues);
    }

    return await findOrThrow(
      this.db.query.stay.findFirst({
        where: { RAW: (t, { eq }) => eq(t.id, data.id) },
        with: stayWithPresetAndApplyPeriod,
      }),
    );
  }

  async deleteStay(data: DeleteStayDTO) {
    const target = await findOrThrow(
      this.db.query.stay.findFirst({
        where: { RAW: (t, { eq }) => eq(t.id, data.id) },
        with: stayWithPresetAndApplyPeriod,
      }),
    );
    await this.db.delete(stay).where(eq(stay.id, data.id));
    return target;
  }

  async getStayApply(data: StayIdDTO) {
    const stayRow = await this.getStay(data);
    if (!stayRow) {
      throw new HttpException(ErrorMsg.Resource_NotFound(), HttpStatus.NOT_FOUND);
    }

    return await this.db.query.stayApply.findMany({
      where: { RAW: (t, { eq }) => eq(t.stayId, data.id) },
      with: stayApplyWithUserAndOuting,
    });
  }

  async createStayApply(data: CreateStayApplyDTO) {
    await findOrThrow(
      this.db.query.user.findFirst({ where: { RAW: (t, { eq }) => eq(t.id, data.user) } }),
    );
    await findOrThrow(
      this.db.query.stay.findFirst({ where: { RAW: (t, { eq }) => eq(t.id, data.stay) } }),
    );

    const exists = await this.db.query.stayApply.findFirst({
      where: {
        RAW: (t, { and, eq }) => andWhere(and, eq(t.userId, data.user), eq(t.stayId, data.stay)),
      },
    });
    if (exists) {
      throw new HttpException(ErrorMsg.StaySeat_Duplication(), HttpStatus.BAD_REQUEST);
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

    const [savedApply] = await this.db
      .insert(stayApply)
      .values({
        stay_seat: data.stay_seat.toUpperCase(),
        userId: data.user,
        stayId: data.stay,
      })
      .returning();

    if (!savedApply) {
      throw new HttpException(ErrorMsg.Resource_NotFound(), HttpStatus.NOT_FOUND);
    }

    const outingValues: (typeof stayOuting.$inferInsert)[] = [];
    for (const outingData of data.outing) {
      outingValues.push({
        reason: outingData.reason,
        breakfast_cancel: outingData.breakfast_cancel,
        lunch_cancel: outingData.lunch_cancel,
        dinner_cancel: outingData.dinner_cancel,
        from: outingData.from,
        to: outingData.to,
        approved: outingData.approved || null,
        audit_reason: outingData.audit_reason || null,
        stayApplyId: savedApply.id,
      });
    }

    if (outingValues.length > 0) {
      await this.db.insert(stayOuting).values(outingValues);
    }

    return await findOrThrow(
      this.db.query.stayApply.findFirst({
        where: { RAW: (t, { eq }) => eq(t.id, savedApply.id) },
        with: stayApplyWithUserAndOuting,
      }),
    );
  }

  async updateStayApply(data: UpdateStayApplyDTO) {
    const existing = await findOrThrow(
      this.db.query.stayApply.findFirst({ where: { RAW: (t, { eq }) => eq(t.id, data.id) } }),
    );
    await findOrThrow(
      this.db.query.user.findFirst({ where: { RAW: (t, { eq }) => eq(t.id, data.user) } }),
    );
    await findOrThrow(
      this.db.query.stay.findFirst({ where: { RAW: (t, { eq }) => eq(t.id, data.stay) } }),
    );

    const staySeatCheck = await this.db.query.stayApply.findFirst({
      where: {
        RAW: (t, { and, eq }) =>
          andWhere(and, eq(t.stay_seat, data.stay_seat.toUpperCase()), eq(t.stayId, data.stay)),
      },
    });
    if (
      staySeatCheck &&
      existing.stay_seat.toUpperCase() !== data.stay_seat.toUpperCase() &&
      isInValidRange(staySeatCheck.stay_seat)
    ) {
      throw new HttpException(ErrorMsg.StaySeat_Duplication(), HttpStatus.BAD_REQUEST);
    }

    await this.db
      .update(stayApply)
      .set({
        stay_seat: data.stay_seat.toUpperCase(),
        userId: data.user,
        stayId: data.stay,
      })
      .where(eq(stayApply.id, data.id));

    // Remove old outings and insert new ones
    await this.db.delete(stayOuting).where(eq(stayOuting.stayApplyId, data.id));

    const outingValues: (typeof stayOuting.$inferInsert)[] = [];
    for (const outingData of data.outing) {
      outingValues.push({
        reason: outingData.reason,
        breakfast_cancel: outingData.breakfast_cancel,
        lunch_cancel: outingData.lunch_cancel,
        dinner_cancel: outingData.dinner_cancel,
        from: outingData.from,
        to: outingData.to,
        approved: outingData.approved || null,
        audit_reason: outingData.audit_reason || null,
        stayApplyId: data.id,
      });
    }

    if (outingValues.length > 0) {
      await this.db.insert(stayOuting).values(outingValues);
    }

    return await findOrThrow(
      this.db.query.stayApply.findFirst({
        where: { RAW: (t, { eq }) => eq(t.id, data.id) },
        with: stayApplyWithUserAndOuting,
      }),
    );
  }

  async deleteStayApply(data: StayApplyIdDTO) {
    const target = await findOrThrow(
      this.db.query.stayApply.findFirst({
        where: { RAW: (t, { eq }) => eq(t.id, data.id) },
        with: stayApplyWithUserAndOuting,
      }),
    );
    await this.db.delete(stayApply).where(eq(stayApply.id, data.id));
    return target;
  }

  async auditOuting(data: AuditOutingDTO) {
    await findOrThrow(
      this.db.query.stayOuting.findFirst({
        where: { RAW: (t, { eq }) => eq(t.id, data.id) },
      }),
    );

    const [updated] = await this.db
      .update(stayOuting)
      .set({
        approved: data.approved,
        audit_reason: data.reason,
      })
      .where(eq(stayOuting.id, data.id))
      .returning();

    return updated;
  }

  async updateOutingMealCancel(data: UpdateOutingMealCancelDTO) {
    await findOrThrow(
      this.db.query.stayOuting.findFirst({
        where: { RAW: (t, { eq }) => eq(t.id, data.id) },
      }),
    );

    const [updated] = await this.db
      .update(stayOuting)
      .set({
        breakfast_cancel: data.breakfast_cancel,
        lunch_cancel: data.lunch_cancel,
        dinner_cancel: data.dinner_cancel,
      })
      .where(eq(stayOuting.id, data.id))
      .returning();

    return updated;
  }

  private weekday2date(base: Date, weekday: number) {
    let target = setDay(base, weekday);
    if (isBefore(target, base)) {
      target = addWeeks(target, 1);
    }
    return target;
  }

  async moveToSomewhere(data: MoveToSomewhereDTO) {
    if (isInValidRange(data.to)) {
      throw new HttpException(ErrorMsg.ItIsStaySeat_ShouldNotBeAllowed(), HttpStatus.BAD_REQUEST);
    }

    const updated = await this.db
      .update(stayApply)
      .set({ stay_seat: data.to })
      .where(inArray(stayApply.id, data.targets))
      .returning();

    return updated;
  }

  // @Cron(CronExpression.EVERY_10_SECONDS)
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async syncStay() {
    // register stay
    const schedules = await this.db.query.staySchedule.findMany({
      with: stayScheduleWithSeatPresetAndPeriod,
    });

    // Filter schedules that have at least one period with apply_end_day > current day of week
    const currentDayOfWeek = getDay(new Date());
    const filteredSchedules = schedules.filter((s) =>
      s.stayApplyPeriodStaySchedule?.some(
        (p: { apply_end_day: number }) => p.apply_end_day > currentDayOfWeek,
      ),
    );

    // Find existing stays that have a parent (generated from schedule) and are still active
    const existingStays = await this.db.query.stay.findMany({
      where: { RAW: (t, { isNotNull }) => isNotNull(t.parentId) },
      with: stayWithParentAndApplyPeriod,
    });

    const activeExistingParentIds = existingStays
      .filter((s) =>
        s.stayApplyPeriodStay?.some((p: { apply_end: Date }) => p.apply_end >= new Date()),
      )
      .map((s) => s.parentId);

    const targetSchedules = filteredSchedules.filter(
      (x) => !activeExistingParentIds.includes(x.id),
    );

    for (const target of targetSchedules) {
      if (activeExistingParentIds.includes(target.id)) {
        continue;
      }

      const now = startOfDay(new TZDate(new Date(), "Asia/Seoul"));

      const periods = target.stayApplyPeriodStaySchedule.map(
        (period: {
          grade: number;
          apply_start_day: number;
          apply_start_hour: number;
          apply_end_day: number;
          apply_end_hour: number;
        }) => {
          return {
            grade: period.grade,
            apply_start: setSeconds(
              setMinutes(setHours(setDay(now, period.apply_start_day), period.apply_start_hour), 0),
              0,
            ),
            apply_end: setSeconds(
              setMinutes(setHours(setDay(now, period.apply_end_day), period.apply_end_hour), 0),
              0,
            ),
          };
        },
      );

      const applyEnd = max(periods.map((p: { apply_end: Date }) => p.apply_end));
      let from = this.weekday2date(now, target.stay_from);
      let to = subSeconds(addDays(this.weekday2date(now, target.stay_to), 1), 1);
      if (isBefore(from, applyEnd)) {
        from = addWeeks(from, 1);
      }
      if (isBefore(to, applyEnd)) {
        to = addWeeks(to, 1);
      }
      if (isBefore(to, from)) {
        to = addWeeks(to, 1);
      }

      let success = true;
      const outingDays = target.outing_day.map((day) => {
        let out = this.weekday2date(now, day);
        if (!isWithinInterval(out, { start: from, end: to })) {
          out = addWeeks(out, 1);
          if (!isWithinInterval(out, { start: from, end: to })) {
            this.logger.error(`Error. Invalid outing range on ${target.name}`);
            success = false;
          }
        }
        return format(out, "yyyy-MM-dd");
      });
      if (!success) {
        continue;
      }

      const [savedStay] = await this.db
        .insert(stay)
        .values({
          name: target.name,
          stay_from: format(from, "yyyy-MM-dd"),
          stay_to: format(to, "yyyy-MM-dd"),
          outing_day: outingDays,
          staySeatPresetId: target.staySeatPresetId,
          parentId: target.id,
        })
        .returning();

      if (!savedStay) {
        throw new HttpException(ErrorMsg.Resource_NotFound(), HttpStatus.NOT_FOUND);
      }

      const periodValues: (typeof stayApplyPeriodStay.$inferInsert)[] = periods.map(
        (p: { grade: number; apply_start: Date; apply_end: Date }) => ({
          grade: p.grade,
          apply_start: p.apply_start,
          apply_end: p.apply_end,
          stayId: savedStay.id,
        }),
      );

      if (periodValues.length > 0) {
        await this.db.insert(stayApplyPeriodStay).values(periodValues);
      }

      this.logger.log(`Successfully added ${savedStay.id}(${savedStay.name})`);
    }

    // remove previous stay (soft delete)
    const expiredStays = await this.db.query.stay.findMany({
      where: {
        RAW: (t, { and, lt, isNull }) =>
          andWhere(and, lt(t.stay_to, format(new Date(), "yyyy-MM-dd")), isNull(t.deletedAt)),
      },
      with: stayWithApplyAndOuting,
    });

    for (const expired of expiredStays) {
      // Soft delete outings for each apply
      for (const apply of expired.stayApply ?? []) {
        if (apply.outing && apply.outing.length > 0) {
          await softDelete(
            this.db,
            stayOuting,
            inArray(
              stayOuting.id,
              apply.outing.map((o: { id: string }) => o.id),
            ),
          );
        }
      }
      // Soft delete applies
      if ((expired.stayApply ?? []).length > 0) {
        await softDelete(
          this.db,
          stayApply,
          inArray(
            stayApply.id,
            (expired.stayApply ?? []).map((a: { id: string }) => a.id),
          ),
        );
      }
      // Soft delete stay
      await softDelete(this.db, stay, eq(stay.id, expired.id));
    }
  }
}
