import { TZDate } from "@date-fns/tz";
import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { Cron, CronExpression } from "@nestjs/schedule";
import { addMinutes, format } from "date-fns";
import { eq } from "drizzle-orm";
import {
  laundryApply,
  laundryMachine,
  laundryTime,
  laundryTimeline,
  laundryTimeToMachine,
} from "#/db/schema";
import { laundryTimelineWithAssignIds } from "#/db/with";
import { LaundrySchedulePriority } from "$mapper/constants";
import { ErrorMsg } from "$mapper/error";
import { CacheService } from "$modules/cache.module";
import { DRIZZLE, type DrizzleDB } from "$modules/drizzle.module";
import { findOrThrow } from "$utils/findOrThrow.util";
import {
  CreateLaundryApplyDTO,
  CreateLaundryMachineDTO,
  CreateLaundryTimelineDTO,
  LaundryApplyIdDTO,
  LaundryMachineIdDTO,
  LaundryTimelineIdDTO,
  UpdateLaundryApplyDTO,
  UpdateLaundryMachineDTO,
  UpdateLaundryTimelineDTO,
} from "~laundry/dto/laundry.manage.dto";
import { LaundryTimelineScheduler } from "~laundry/schedulers/scheduler.interface";
import { PushNotificationToSpecificDTO } from "~push/dto/push.manage.dto";
import { PushManageService } from "~push/providers";

@Injectable()
export class LaundryManageService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    readonly pushManageService: PushManageService,
    readonly cacheService: CacheService,
    readonly moduleRef: ModuleRef,
  ) {}

  async getLaundryTimelineList() {
    const timelines = await this.db.query.laundryTimeline.findMany({
      columns: { id: true, name: true, enabled: true },
    });
    return timelines;
  }

  async getLaundryTimeline(data: LaundryTimelineIdDTO) {
    return await findOrThrow(
      this.db.query.laundryTimeline.findFirst({
        where: { RAW: (t, { eq }) => eq(t.id, data.id) },
        with: laundryTimelineWithAssignIds,
      }),
    );
  }

  async createLaundryTimeline(data: CreateLaundryTimelineDTO) {
    const [savedTimeline] = await this.db
      .insert(laundryTimeline)
      .values({
        name: data.name,
        scheduler: data.scheduler,
      })
      .returning();

    if (!savedTimeline) {
      throw new HttpException(ErrorMsg.Resource_NotFound(), HttpStatus.NOT_FOUND);
    }

    for (const time of data.times) {
      const [savedTime] = await this.db
        .insert(laundryTime)
        .values({
          time: time.time,
          grade: time.grade,
          timelineId: savedTimeline.id,
        })
        .returning();

      if (!savedTime) {
        throw new HttpException(ErrorMsg.Resource_NotFound(), HttpStatus.NOT_FOUND);
      }

      // Insert ManyToMany join records
      if (time.assigns && time.assigns.length > 0) {
        const joinValues = time.assigns.map((machineId: string) => ({
          laundryTimeId: savedTime.id,
          laundryMachineId: machineId,
        }));
        await this.db.insert(laundryTimeToMachine).values(joinValues);
      }
    }

    return await findOrThrow(
      this.db.query.laundryTimeline.findFirst({
        where: { RAW: (t, { eq }) => eq(t.id, savedTimeline.id) },
        with: laundryTimelineWithAssignIds,
      }),
    );
  }

  async updateLaundryTimeline(data: UpdateLaundryTimelineDTO) {
    await findOrThrow(
      this.db.query.laundryTimeline.findFirst({
        where: { RAW: (t, { eq }) => eq(t.id, data.id) },
        with: laundryTimelineWithAssignIds,
      }),
    );

    await this.db
      .update(laundryTimeline)
      .set({ name: data.name, scheduler: data.scheduler })
      .where(eq(laundryTimeline.id, data.id));

    // Remove old times (cascade will remove join table entries)
    await this.db.delete(laundryTime).where(eq(laundryTime.timelineId, data.id));

    for (const time of data.times) {
      const [savedTime] = await this.db
        .insert(laundryTime)
        .values({
          time: time.time,
          grade: time.grade,
          timelineId: data.id,
        })
        .returning();

      if (!savedTime) {
        throw new HttpException(ErrorMsg.Resource_NotFound(), HttpStatus.NOT_FOUND);
      }

      // Insert ManyToMany join records
      if (time.assigns && time.assigns.length > 0) {
        const joinValues = time.assigns.map((machineId: string) => ({
          laundryTimeId: savedTime.id,
          laundryMachineId: machineId,
        }));
        await this.db.insert(laundryTimeToMachine).values(joinValues);
      }
    }

    return await findOrThrow(
      this.db.query.laundryTimeline.findFirst({
        where: { RAW: (t, { eq }) => eq(t.id, data.id) },
        with: laundryTimelineWithAssignIds,
      }),
    );
  }

  async deleteLaundryTimeline(data: LaundryTimelineIdDTO) {
    await findOrThrow(
      this.db.query.laundryTimeline.findFirst({
        where: { RAW: (t, { eq }) => eq(t.id, data.id) },
      }),
    );
    const [deleted] = await this.db
      .delete(laundryTimeline)
      .where(eq(laundryTimeline.id, data.id))
      .returning();
    return deleted;
  }

  async enableLaundryTimeline(data: LaundryTimelineIdDTO) {
    // Disable all timelines
    await this.db.update(laundryTimeline).set({ enabled: false });

    // Enable the target
    await this.db
      .update(laundryTimeline)
      .set({ enabled: true })
      .where(eq(laundryTimeline.id, data.id));

    return await this.db.query.laundryTimeline.findMany();
  }

  async getLaundryMachineList() {
    return await this.db.query.laundryMachine.findMany();
  }

  async createLaundryMachine(data: CreateLaundryMachineDTO) {
    const [saved] = await this.db
      .insert(laundryMachine)
      .values({
        type: data.type,
        name: data.name,
        gender: data.gender,
        enabled: data.enabled,
      })
      .returning();

    if (!saved) {
      throw new HttpException(ErrorMsg.Resource_NotFound(), HttpStatus.NOT_FOUND);
    }

    return await findOrThrow(
      this.db.query.laundryMachine.findFirst({
        where: { RAW: (t, { eq }) => eq(t.id, saved.id) },
      }),
    );
  }

  async updateLaundryMachine(data: UpdateLaundryMachineDTO) {
    await findOrThrow(
      this.db.query.laundryMachine.findFirst({
        where: { RAW: (t, { eq }) => eq(t.id, data.id) },
      }),
    );

    await this.db
      .update(laundryMachine)
      .set({
        type: data.type,
        name: data.name,
        gender: data.gender,
        enabled: data.enabled,
      })
      .where(eq(laundryMachine.id, data.id));

    return await findOrThrow(
      this.db.query.laundryMachine.findFirst({
        where: { RAW: (t, { eq }) => eq(t.id, data.id) },
      }),
    );
  }

  async deleteLaundryMachine(data: LaundryMachineIdDTO) {
    await findOrThrow(
      this.db.query.laundryMachine.findFirst({
        where: { RAW: (t, { eq }) => eq(t.id, data.id) },
      }),
    );
    const [deleted] = await this.db
      .delete(laundryMachine)
      .where(eq(laundryMachine.id, data.id))
      .returning();
    return deleted;
  }

  async getLaundryApplyList() {
    return await this.db.query.laundryApply.findMany({
      where: { RAW: (t, { eq }) => eq(t.date, format(new Date(), "yyyy-MM-dd")) },
      with: {
        user: true,
        laundryMachine: true,
        laundryTime: true,
        laundryTimeline: true,
      },
    });
  }

  async createLaundryApply(data: CreateLaundryApplyDTO) {
    const timeline = await findOrThrow(
      this.db.query.laundryTimeline.findFirst({
        where: { RAW: (t, { eq }) => eq(t.id, data.laundryTime) },
      }),
    );

    // Find the timeline that contains this time
    const timeRow = await this.db.query.laundryTime.findFirst({
      where: { RAW: (t, { eq }) => eq(t.id, data.laundryTime) },
      with: { timeline: true },
    });
    const actualTimeline = timeRow?.timeline ?? timeline;

    await findOrThrow(
      this.db.query.laundryTime.findFirst({
        where: { RAW: (t, { eq }) => eq(t.id, data.laundryTime) },
      }),
    );
    const machineRow = await findOrThrow(
      this.db.query.laundryMachine.findFirst({
        where: { RAW: (t, { eq }) => eq(t.id, data.machine) },
      }),
    );
    await findOrThrow(
      this.db.query.user.findFirst({ where: { RAW: (t, { eq }) => eq(t.id, data.user) } }),
    );

    const applyExists = await this.db.query.laundryApply.findFirst({
      where: { RAW: (t, { eq }) => eq(t.userId, data.user) },
    });
    if (applyExists) {
      throw new HttpException(
        ErrorMsg.LaundryApply_AlreadyExists(machineRow.type === "washer" ? "세탁" : "건조"),
        HttpStatus.BAD_REQUEST,
      );
    }

    const machineTaken = await this.db.query.laundryApply.findFirst({
      where: { RAW: (t, { eq }) => eq(t.laundryMachineId, data.machine) },
    });
    if (machineTaken) {
      throw new HttpException(ErrorMsg.LaundryMachine_AlreadyTaken(), HttpStatus.BAD_REQUEST);
    }

    const date = format(new Date(), "yyyy-MM-dd");

    const [saved] = await this.db
      .insert(laundryApply)
      .values({
        date,
        laundryTimelineId: actualTimeline.id,
        laundryTimeId: data.laundryTime,
        laundryMachineId: data.machine,
        userId: data.user,
      })
      .returning();

    if (!saved) {
      throw new HttpException(ErrorMsg.Resource_NotFound(), HttpStatus.NOT_FOUND);
    }

    return await findOrThrow(
      this.db.query.laundryApply.findFirst({
        where: { RAW: (t, { eq }) => eq(t.id, saved.id) },
      }),
    );
  }

  async updateLaundryApply(data: UpdateLaundryApplyDTO) {
    await findOrThrow(
      this.db.query.laundryApply.findFirst({ where: { RAW: (t, { eq }) => eq(t.id, data.id) } }),
    );
    await findOrThrow(
      this.db.query.user.findFirst({ where: { RAW: (t, { eq }) => eq(t.id, data.user) } }),
    );

    await this.db
      .update(laundryApply)
      .set({ userId: data.user })
      .where(eq(laundryApply.id, data.id));

    return await findOrThrow(
      this.db.query.laundryApply.findFirst({ where: { RAW: (t, { eq }) => eq(t.id, data.id) } }),
    );
  }

  async deleteLaundryApply(data: LaundryApplyIdDTO) {
    await findOrThrow(
      this.db.query.laundryApply.findFirst({ where: { RAW: (t, { eq }) => eq(t.id, data.id) } }),
    );
    const [deleted] = await this.db
      .delete(laundryApply)
      .where(eq(laundryApply.id, data.id))
      .returning();
    return deleted;
  }

  @Cron(CronExpression.EVERY_HOUR)
  // @Cron(CronExpression.EVERY_SECOND)
  private async laundryTimelineScheduler() {
    const timelines = await this.db.query.laundryTimeline.findMany();

    const disable = async () => {
      await this.db.update(laundryTimeline).set({ enabled: false });
    };

    for (const schedulerItem of LaundrySchedulePriority) {
      const scheduler: LaundryTimelineScheduler = this.moduleRef.get(schedulerItem.scheduler, {
        strict: false,
      });

      const shouldEnable = await scheduler.evaluate(timelines);
      if (shouldEnable) {
        const target = timelines.filter((t) => t.scheduler === schedulerItem.schedule);
        if (target.length === 1 && target[0]) {
          // not a etc
          if (target[0].enabled === true) {
            // already on
            break; // keep it.
          } else {
            await disable();
            await this.db
              .update(laundryTimeline)
              .set({ enabled: true })
              .where(eq(laundryTimeline.id, target[0].id));
            break;
          }
        } else {
          break; // etc and current enabled is etc
        }
      }
      // continue to evaluate next
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  private async laundryNotificationScheduler() {
    const now = new Date();
    const inFifteenMinutes = format(addMinutes(new TZDate(now, "Asia/Seoul"), 15), "HH:mm");
    const todayDate = format(new TZDate(now, "Asia/Seoul"), "yyyy-MM-dd");

    const applies = await this.db.query.laundryApply.findMany({
      where: { RAW: (t, { eq }) => eq(t.date, todayDate) },
      with: {
        user: true,
        laundryMachine: true,
        laundryTime: true,
      },
    });

    // Filter by time in application code since we loaded the relation
    const filteredApplies = applies.filter((a) => a.laundryTime?.time === inFifteenMinutes);

    for (const apply of filteredApplies) {
      if (await this.cacheService.isNotificationAlreadySent(apply.id)) {
        continue;
      }

      if (!apply.user || !apply.laundryMachine || !apply.laundryTime) {
        continue;
      }

      const applyUser = apply.user;
      const machineType = apply.laundryMachine.type === "washer" ? "세탁" : "건조";
      const title = `${machineType} 알림`;
      const body = `15분뒤 ${apply.laundryTime.time}에 ${machineType}이 예약되어 있습니다. (${apply.laundryMachine.name})`;

      const dto: PushNotificationToSpecificDTO = {
        to: [applyUser.id],
        title: title,
        body: body,
        category: "laundry",
        url: "/laundry",
        data: undefined,
        actions: [],
        icon: "https://dimigoin.io/dimigoin.png",
        badge: "https://dimigoin.io/dimigoin.png",
      };

      await this.pushManageService.sendToSpecificUsers(dto);
    }
  }
}
