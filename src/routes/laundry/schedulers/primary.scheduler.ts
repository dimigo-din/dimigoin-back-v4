import { Injectable } from "@nestjs/common";
import type { laundryTimeline } from "#/db/schema";
import { LaundryTimelineScheduler } from "./scheduler.interface";

type LaundryTimelineRow = typeof laundryTimeline.$inferSelect;

@Injectable()
export class PrimaryScheduler extends LaundryTimelineScheduler {
  async evaluate(_timelines: LaundryTimelineRow[]): Promise<boolean> {
    return true;
  }
}
