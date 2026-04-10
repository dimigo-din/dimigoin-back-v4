import { TZDate } from "@date-fns/tz";
import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { addHours, format, isAfter, startOfDay } from "date-fns";
import { and, eq } from "drizzle-orm";
import { laundryApply, laundryMachine } from "#/db/schema";
import { laundryApplyForStudentApplies, laundryTimelineForStudentTimeline } from "#/db/with";
import { ErrorMsg } from "$mapper/error";
import type { UserJWT } from "$mapper/types";
import { DRIZZLE, type DrizzleDB } from "$modules/drizzle.module";
import { findOrThrow } from "$utils/findOrThrow.util";
import { andWhere } from "$utils/where.util";
import { LaundryApplyDTO, LaundryApplyIdDTO } from "~laundry/dto/laundry.student.dto";
import { UserManageService } from "~user/providers";

type MachineAssignWithLaundryTime = {
  laundryTime: Record<string, unknown> | null;
};

type LaundryMachineWithAssigns = {
  assigns?: MachineAssignWithLaundryTime[] | null;
  [key: string]: unknown;
};

type TimeAssignWithMachine = {
  laundryMachine: LaundryMachineWithAssigns | null;
};

type TimelineTime = {
  assigns?: TimeAssignWithMachine[] | null;
  timeline?: Record<string, unknown> | null;
  [key: string]: unknown;
};

type LaundryTimelineWithTimes = {
  scheduler?: string | null;
  times?: TimelineTime[] | null;
  [key: string]: unknown;
};

type LaundryTimeWithRelations = {
  assigns?: TimeAssignWithMachine[] | null;
  timeline?: LaundryTimelineWithTimes | null;
  [key: string]: unknown;
};

type LaundryApplyWithRelations = {
  laundryTimeline?: LaundryTimelineWithTimes | null;
  laundryTime?: LaundryTimeWithRelations | null;
  laundryMachine?: LaundryMachineWithAssigns | null;
  [key: string]: unknown;
};

@Injectable()
export class LaundryStudentService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly userManageService: UserManageService,
  ) {}

  async getTimeline() {
    const timeline = await findOrThrow(
      this.db.query.laundryTimeline.findFirst({
        where: { RAW: (t, { eq }) => eq(t.enabled, true) },
        with: laundryTimelineForStudentTimeline,
      }),
    );

    return {
      ...timeline,
      triggeredOn: timeline.scheduler,
      times: timeline.times.map((time) => ({
        ...time,
        assigns: time.assigns
          .map((assign) => assign.laundryMachine)
          .filter((machine) => machine !== null)
          .map((machine) => this.mapMachine(machine)),
      })),
    };
  }

  async getApplies() {
    const todayDate = format(new TZDate(new Date(), "Asia/Seoul"), "yyyy-MM-dd");

    const applies = await this.db.query.laundryApply.findMany({
      where: { RAW: (t, { eq }) => eq(t.date, todayDate) },
      with: laundryApplyForStudentApplies,
    });

    // Filter only applies from enabled timelines
    return applies
      .filter((a) => a.laundryTimeline?.enabled === true)
      .map((apply) => this.mapApply(apply));
  }

  async createApply(userJwt: UserJWT, data: LaundryApplyDTO) {
    const now = new Date();
    const seoulNow = new TZDate(now, "Asia/Seoul");
    const eightAM = addHours(startOfDay(seoulNow), 8);
    if (!isAfter(seoulNow, eightAM)) {
      throw new HttpException(ErrorMsg.LaundryApplyIsAfterEightAM(), HttpStatus.BAD_REQUEST);
    }

    const userDetail = await this.userManageService.getRequiredUserDetail(userJwt.id);

    const machineRow = await findOrThrow(
      this.db.query.laundryMachine.findFirst({
        where: { RAW: (t, { eq }) => eq(t.id, data.machine) },
      }),
    );
    const todayDate = format(new TZDate(now, "Asia/Seoul"), "yyyy-MM-dd");

    const applyExists = await this.db
      .select()
      .from(laundryApply)
      .innerJoin(laundryMachine, eq(laundryApply.laundryMachineId, laundryMachine.id))
      .where(
        and(
          eq(laundryApply.userId, userJwt.id),
          eq(laundryApply.date, todayDate),
          eq(laundryMachine.type, machineRow.type),
        ),
      )
      .limit(1);

    // Check if user already has an apply for same machine type
    if (applyExists.length > 0) {
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
      timeResult.grade.indexOf(userDetail.grade) === -1 ||
      machineRow.gender !== userDetail.gender
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

    return await this.db.transaction(async (tx) => {
      const [saved] = await tx
        .insert(laundryApply)
        .values({
          laundryTimelineId: timeline.id,
          laundryTimeId: data.time,
          laundryMachineId: data.machine,
          userId: userJwt.id,
          date: todayDate,
        })
        .returning();

      if (!saved) {
        throw new HttpException(ErrorMsg.Resource_NotFound(), HttpStatus.NOT_FOUND);
      }

      const result = await tx.query.laundryApply.findFirst({
        where: { RAW: (t, { eq }) => eq(t.id, saved.id) },
        with: laundryApplyForStudentApplies,
      });

      if (!result) {
        throw new HttpException(ErrorMsg.Resource_NotFound(), HttpStatus.NOT_FOUND);
      }

      return this.mapApply(result);
    });
  }

  async deleteApply(userJwt: UserJWT, data: LaundryApplyIdDTO) {
    return await this.db.transaction(async (tx) => {
      const apply = await findOrThrow(
        tx.query.laundryApply.findFirst({
          where: {
            RAW: (t, { and, eq }) => andWhere(and, eq(t.userId, userJwt.id), eq(t.id, data.id)),
          },
          with: laundryApplyForStudentApplies,
        }),
      );

      await tx.delete(laundryApply).where(eq(laundryApply.id, data.id));

      return this.mapApply(apply);
    });
  }

  private isNonNullable<T>(value: T | null | undefined): value is T {
    return value !== null && value !== undefined;
  }

  private mapMachine(machine: LaundryMachineWithAssigns) {
    const laundryTime = (machine.assigns ?? [])
      .map((machineAssign) => machineAssign.laundryTime)
      .filter(this.isNonNullable);
    const { assigns: _assigns, ...machineInfo } = machine;

    return {
      ...machineInfo,
      laundryTime,
    };
  }

  private mapTimelineTime(time: TimelineTime) {
    return {
      ...time,
      assigns: (time.assigns ?? [])
        .map((assign) => assign.laundryMachine)
        .filter(this.isNonNullable)
        .map((machine) => this.mapMachine(machine)),
      timeline: time.timeline ?? {},
    };
  }

  private mapTimeline(timeline: LaundryTimelineWithTimes) {
    return {
      ...timeline,
      triggeredOn: timeline.scheduler ?? null,
      times: (timeline.times ?? []).map((time) => this.mapTimelineTime(time)),
    };
  }

  private mapLaundryTime(laundryTime: LaundryTimeWithRelations) {
    return {
      ...laundryTime,
      assigns: (laundryTime.assigns ?? [])
        .map((assign) => assign.laundryMachine)
        .filter(this.isNonNullable)
        .map((machine) => this.mapMachine(machine)),
      timeline: laundryTime.timeline ? this.mapTimeline(laundryTime.timeline) : null,
    };
  }

  private mapApply(apply: LaundryApplyWithRelations) {
    return {
      ...apply,
      laundryTimeline: apply.laundryTimeline ? this.mapTimeline(apply.laundryTimeline) : null,
      laundryTime: apply.laundryTime ? this.mapLaundryTime(apply.laundryTime) : null,
      laundryMachine: apply.laundryMachine ? this.mapMachine(apply.laundryMachine) : null,
    };
  }
}
