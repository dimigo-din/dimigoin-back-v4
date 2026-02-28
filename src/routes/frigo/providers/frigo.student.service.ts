import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import {
  addWeeks,
  format,
  isAfter,
  isWithinInterval,
  setDay,
  setHours,
  startOfWeek,
} from "date-fns";
import { eq } from "drizzle-orm";
import { frigoApply } from "#/db/schema";
import { frigoApplyWithUser } from "#/db/with";
import { ErrorMsg } from "$mapper/error";
import { UserJWT } from "$mapper/types";
import { DRIZZLE, type DrizzleDB } from "$modules/drizzle.module";
import { DayNumber2String } from "$utils/date.util";
import { findOrThrow } from "$utils/findOrThrow.util";
import { andWhere } from "$utils/where.util";
import { ClientFrigoApplyDTO } from "~frigo/dto/frigo.dto";
import { UserManageService } from "~user/providers";

@Injectable()
export class FrigoStudentService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly userManageService: UserManageService,
  ) {}

  async getApply(userJwt: UserJWT) {
    const week = format(startOfWeek(new Date()), "yyyy-MM-dd");

    return (
      (await this.db.query.frigoApply.findFirst({
        where: {
          RAW: (t, { and, eq }) => andWhere(and, eq(t.userId, userJwt.id), eq(t.week, week)),
        },
        with: frigoApplyWithUser,
      })) ?? null
    );
  }

  // fuck you consistency
  async frigoApply(userJwt: UserJWT, data: ClientFrigoApplyDTO) {
    const userDetail = await this.userManageService.getRequiredUserDetail(userJwt.id);

    // validation
    const period = await findOrThrow(
      this.db.query.frigoApplyPeriod.findFirst({
        where: { RAW: (t, { eq }) => eq(t.grade, userDetail.grade) },
      }),
      new HttpException(ErrorMsg.FrigoPeriod_NotExistsForGrade(), HttpStatus.FORBIDDEN),
    );

    const now = new Date();
    let start = setHours(setDay(now, period.apply_start_day), period.apply_start_hour);
    const end = setHours(setDay(now, period.apply_end_day), period.apply_end_hour);
    if (isAfter(start, end)) {
      start = addWeeks(start, 1);
    }
    if (!isWithinInterval(now, { start, end })) {
      throw new HttpException(
        ErrorMsg.FrigoPeriod_NotInApplyPeriod(
          DayNumber2String(period.apply_start_day),
          period.apply_start_hour,
          DayNumber2String(period.apply_end_day),
          period.apply_end_hour,
        ),
        HttpStatus.BAD_REQUEST,
      );
    }

    // apply
    const dbUser = await findOrThrow(
      this.db.query.user.findFirst({ where: { RAW: (t, { eq }) => eq(t.id, userJwt.id) } }),
    );
    const week = format(startOfWeek(new Date()), "yyyy-MM-dd");
    const exists = await this.db.query.frigoApply.findFirst({
      where: { RAW: (t, { and, eq }) => andWhere(and, eq(t.week, week), eq(t.userId, dbUser.id)) },
    });
    if (exists) {
      throw new HttpException(ErrorMsg.Frigo_AlreadyApplied(), HttpStatus.BAD_REQUEST);
    }

    const [created] = await this.db
      .insert(frigoApply)
      .values({
        timing: data.timing,
        reason: data.reason,
        week: week,
        userId: dbUser.id,
      })
      .returning();

    if (!created) {
      throw new HttpException(ErrorMsg.Resource_NotFound(), HttpStatus.NOT_FOUND);
    }

    return await findOrThrow(
      this.db.query.frigoApply.findFirst({
        where: { RAW: (t, { eq }) => eq(t.id, created.id) },
        with: frigoApplyWithUser,
      }),
    );
  }

  async cancelApply(userJwt: UserJWT) {
    const week = format(startOfWeek(new Date()), "yyyy-MM-dd");
    const apply = await findOrThrow(
      this.db.query.frigoApply.findFirst({
        where: {
          RAW: (t, { and, eq }) => andWhere(and, eq(t.userId, userJwt.id), eq(t.week, week)),
        },
        with: frigoApplyWithUser,
      }),
    );

    await this.db.delete(frigoApply).where(eq(frigoApply.id, apply.id));

    return apply;
  }
}
