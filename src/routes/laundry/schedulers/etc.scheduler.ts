import { Injectable } from "@nestjs/common";
import type { laundryTimeline } from "#/db/schema";
import { LaundryTimelineScheduler } from "./scheduler.interface";

type LaundryTimelineRow = typeof laundryTimeline.$inferSelect;

@Injectable()
export class EtcScheduler extends LaundryTimelineScheduler {
  async evaluate(timelines: LaundryTimelineRow[]): Promise<boolean> {
    // if the current schedule is etc, keep it.
    if (timelines.find((t) => t.enabled === true && t.scheduler === "etc")) {
      return true;
    } else {
      return false;
    }
  }
}
