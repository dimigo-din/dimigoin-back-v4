import { TZDate } from "@date-fns/tz";
import { Inject, Injectable } from "@nestjs/common";
import { format } from "date-fns";
import type { laundryTimeline } from "#/db/schema";
import { DRIZZLE, type DrizzleDB } from "$modules/drizzle.module";
import { LaundryTimelineScheduler } from "./scheduler.interface";

type LaundryTimelineRow = typeof laundryTimeline.$inferSelect;

@Injectable()
export class StayScheduler extends LaundryTimelineScheduler {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {
    super();
  }

  async evaluate(timelines: LaundryTimelineRow[]): Promise<boolean> {
    const stayTimeline = timelines.find((x) => x.scheduler === "stay");
    if (stayTimeline) {
      const today = format(new TZDate(new Date(), "Asia/Seoul"), "yyyy-MM-dd");
      const stayRow = await this.db.query.stay.findFirst({
        where: {
          RAW: (t, { and, lte, gte }) => and(lte(t.stay_from, today), gte(t.stay_to, today)),
        },
      });

      if (stayRow) {
        return true;
      }
    }

    return false;
  }
}
