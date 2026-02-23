import { TZDate } from "@date-fns/tz";
import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { format } from "date-fns";
import { type SQL } from "drizzle-orm";
import { mealTimeline, mealTimelineDelay, mealTimelineSlot } from "#/db/schema";
import { type Class, type Grade } from "$mapper/types";
import { DRIZZLE, type DrizzleDB } from "$modules/drizzle.module";
import { andWhere } from "$utils/where.util";
import {
  GetMealTimelineQueryDTO,
  PatchMealTimelineDTO,
  PostMealTimelineDTO,
} from "~meal/dto/meal.dto";
import { PushManageService } from "~push/providers";

@Injectable()
export class MealDienenService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly pushService: PushManageService,
  ) {}

  private today() {
    return format(new TZDate(new Date(), "Asia/Seoul"), "yyyy-MM-dd");
  }

  async getTimeline(data: GetMealTimelineQueryDTO) {
    const date = data.date ?? this.today();

    const timeline = await this.db.query.mealTimeline.findFirst({
      where: { RAW: (t, { and, lte, gte }) => andWhere(and, lte(t.start, date), gte(t.end, date)) },
      with: { slots: true },
    });

    if (!timeline) {
      return { "1": [], "2": [], "3": [] };
    }

    const result: Record<string, { time: string; class: number[] }[]> = {
      "1": [],
      "2": [],
      "3": [],
    };

    for (const slot of timeline.slots) {
      const gradeKey = String(slot.grade);
      if (gradeKey in result) {
        result[gradeKey]?.push({ time: slot.time, class: slot.classes });
      }
    }

    return result;
  }

  async createTimeline(data: PostMealTimelineDTO) {
    const [created] = await this.db
      .insert(mealTimeline)
      .values({ start: data.start, end: data.end })
      .returning();

    if (!created) {
      throw new HttpException("Failed to create timeline", HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const slotsToInsert: { grade: number; time: string; classes: number[]; timelineId: string }[] =
      [];

    for (const gradeKey of ["1", "2", "3"] as const) {
      const slots = data.data[gradeKey] ?? [];
      for (const slot of slots) {
        slotsToInsert.push({
          grade: Number(gradeKey),
          time: slot.time,
          classes: slot.class,
          timelineId: created.id,
        });
      }
    }

    if (slotsToInsert.length > 0) {
      await this.db.insert(mealTimelineSlot).values(slotsToInsert);
    }

    return created;
  }

  async delayTimeline(data: PatchMealTimelineDTO) {
    const date = data.date ?? this.today();

    const timeline = await this.db.query.mealTimeline.findFirst({
      where: { RAW: (t, { and, lte, gte }) => andWhere(and, lte(t.start, date), gte(t.end, date)) },
      with: { slots: true },
    });

    if (!timeline) {
      throw new HttpException("No active timeline found for the given date", HttpStatus.NOT_FOUND);
    }

    await this.db.insert(mealTimelineDelay).values({
      date,
      source: data.source,
      dest: data.dest,
      description: data.description,
      timelineId: timeline.id,
    });

    const affectedSlots = timeline.slots.filter((s) => s.time === data.source);
    if (affectedSlots.length > 0) {
      const gradeClassPairs = affectedSlots.flatMap((s) =>
        s.classes.map((cls) => ({ grade: s.grade, class: cls })),
      );

      const users = await this.db.query.user.findMany({
        where: {
          RAW: (t, { or, and, eq }) =>
            or(
              ...gradeClassPairs.map((p) =>
                and(eq(t.grade, p.grade as Grade), eq(t.class, p.class as Class)),
              ),
            ) as SQL,
        },
        columns: { id: true },
      });

      const userIds = users.map((u) => u.id);
      if (userIds.length > 0) {
        await this.pushService.sendToSpecificUsers({
          to: userIds,
          title: "급식 시간 변경",
          body: `${data.source} → ${data.dest}: ${data.description}`,
          category: "SchoolInformation",
          url: "",
          data: {},
          actions: [],
          icon: "",
          badge: "",
        });
      }
    }
  }
}
