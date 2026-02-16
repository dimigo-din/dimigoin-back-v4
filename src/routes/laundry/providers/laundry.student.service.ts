import { TZDate } from "@date-fns/tz";
import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { addHours, format, isAfter, startOfDay } from "date-fns";
import { eq } from "drizzle-orm";
import { laundryApply } from "#/db/schema";
import { ErrorMsg } from "$mapper/error";
import type { Grade, UserJWT } from "$mapper/types";
import { DRIZZLE, type DrizzleDB } from "$modules/drizzle.module";
import { findOrThrow } from "$utils/findOrThrow.util";
import { andWhere } from "$utils/where.util";
import { LaundryApplyDTO, LaundryApplyIdDTO } from "~laundry/dto/laundry.student.dto";
import { UserManageService } from "~user/providers";

@Injectable()
export class LaundryStudentService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly userManageService: UserManageService,
  ) {}

  async getTimeline() {
    return await findOrThrow(
      this.db.query.laundryTimeline.findFirst({
        where: { RAW: (t, { eq }) => eq(t.enabled, true) },
        with: {
          times: {
            with: {
              assigns: true,
            },
          },
        },
      }),
    );
  }

  async getApplies() {
    const todayDate = format(new TZDate(new Date(), "Asia/Seoul"), "yyyy-MM-dd");

    const applies = await this.db.query.laundryApply.findMany({
      where: { RAW: (t, { eq }) => eq(t.date, todayDate) },
      with: {
        laundryTime: {
          with: {
            assigns: true,
          },
        },
        laundryMachine: true,
        laundryTimeline: true,
        user: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Filter only applies from enabled timelines
    return applies.filter((a) => a.laundryTimeline?.enabled === true);
  }

  async createApply(userJwt: UserJWT, data: LaundryApplyDTO) {
    const now = new Date();
    const seoulNow = new TZDate(now, "Asia/Seoul");
    const eightAM = addHours(startOfDay(seoulNow), 8);
    if (!isAfter(seoulNow, eightAM)) {
      throw new HttpException(ErrorMsg.LaundryApplyIsAfterEightAM(), HttpStatus.BAD_REQUEST);
    }

    await findOrThrow(
      this.db.query.user.findFirst({ where: { RAW: (t, { eq }) => eq(t.id, userJwt.id) } }),
    );

    const machineRow = await findOrThrow(
      this.db.query.laundryMachine.findFirst({
        where: { RAW: (t, { eq }) => eq(t.id, data.machine) },
      }),
    );
    const todayDate = format(new TZDate(now, "Asia/Seoul"), "yyyy-MM-dd");

    const applyExists = await this.db.query.laundryApply.findFirst({
      where: {
        RAW: (t, { and, eq }) =>
          andWhere(
            and,
            eq(t.userId, userJwt.id),
            eq(t.date, todayDate),
            eq(t.laundryMachineId, data.machine),
          ),
      },
      with: {
        laundryMachine: true,
      },
    });

    // Check if user already has an apply for same machine type
    if (applyExists && applyExists.laundryMachine?.type === machineRow.type) {
      throw new HttpException(
        ErrorMsg.LaundryApply_AlreadyExists(machineRow.type === "washer" ? "세탁" : "건조"),
        HttpStatus.BAD_REQUEST,
      );
    }

    // Find the timeline that contains this time
    const timeRow = await this.db.query.laundryTime.findFirst({
      where: { RAW: (t, { eq }) => eq(t.id, data.time) },
      with: { timeline: true },
    });
    if (!timeRow) {
      throw new HttpException(ErrorMsg.Resource_NotFound(), HttpStatus.NOT_FOUND);
    }
    if (!timeRow.timeline) {
      throw new HttpException(ErrorMsg.Resource_NotFound(), HttpStatus.NOT_FOUND);
    }
    const timeline = timeRow.timeline;

    const timeResult = await findOrThrow(
      this.db.query.laundryTime.findFirst({ where: { RAW: (t, { eq }) => eq(t.id, data.time) } }),
    );

    if (
      timeResult.grade.indexOf(data.grade as Grade) === -1 ||
      !(await this.userManageService.checkUserDetail(userJwt.email, {
        grade: data.grade,
        gender: machineRow.gender,
      }))
    ) {
      throw new HttpException(ErrorMsg.PermissionDenied_Resource_Grade(), HttpStatus.FORBIDDEN);
    }

    const machineTaken = await this.db.query.laundryApply.findFirst({
      where: {
        RAW: (t, { and, eq }) =>
          andWhere(
            and,
            eq(t.laundryMachineId, data.machine),
            eq(t.date, todayDate),
            eq(t.laundryTimeId, data.time),
          ),
      },
    });
    if (machineTaken) {
      throw new HttpException(ErrorMsg.LaundryMachine_AlreadyTaken(), HttpStatus.BAD_REQUEST);
    }

    const [saved] = await this.db
      .insert(laundryApply)
      .values({
        laundryTimelineId: timeline.id,
        laundryTimeId: data.time,
        laundryMachineId: data.machine,
        userId: userJwt.id,
        date: todayDate,
      })
      .returning();

    return saved;
  }

  async deleteApply(userJwt: UserJWT, data: LaundryApplyIdDTO) {
    await findOrThrow(
      this.db.query.laundryApply.findFirst({
        where: {
          RAW: (t, { and, eq }) => andWhere(and, eq(t.userId, userJwt.id), eq(t.id, data.id)),
        },
      }),
    );

    const [deleted] = await this.db
      .delete(laundryApply)
      .where(eq(laundryApply.id, data.id))
      .returning();
    return deleted;
  }
}
