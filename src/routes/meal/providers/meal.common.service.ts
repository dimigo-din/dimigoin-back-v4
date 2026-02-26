import { TZDate } from "@date-fns/tz";
import { Inject, Injectable } from "@nestjs/common";
import { format } from "date-fns";
import { MealTimelineDelay } from "#/db/schema";
import { DRIZZLE, type DrizzleDB } from "$modules/drizzle.module";
import { andWhere } from "$utils/where.util";

@Injectable()
export class MealCommonService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  today() {
    return format(new TZDate(new Date(), "Asia/Seoul"), "yyyy-MM-dd");
  }

  async findTimeline(date: string) {
    return this.db.query.mealTimeline.findFirst({
      where: { RAW: (t, { and, lte, gte }) => andWhere(and, lte(t.start, date), gte(t.end, date)) },
      with: { slots: true, delays: true },
    });
  }

  resolveTime(delays: MealTimelineDelay[], date: string, slotTime: string) {
    const matched = delays
      .filter((d) => d.date === date && d.source === slotTime)
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
    return matched[0] ? matched[0].dest : slotTime;
  }
}
