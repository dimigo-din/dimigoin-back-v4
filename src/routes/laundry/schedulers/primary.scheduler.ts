import { Injectable } from "@nestjs/common";
import { LaundryTimeline } from "#/schemas";
import { LaundryTimelineScheduler } from "./scheduler.interface";

@Injectable()
export class PrimaryScheduler extends LaundryTimelineScheduler {
  async evaluate(_timelines: LaundryTimeline[]): Promise<boolean> {
    return true;
  }
}
