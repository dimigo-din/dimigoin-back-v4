import { Injectable } from "@nestjs/common";
import { LaundryTimeline } from "#/schemas";
import { LaundryTimelineScheduler } from "./scheduler.interface";

@Injectable()
export class VacationScheduler extends LaundryTimelineScheduler {
  async evaluate(_timelines: LaundryTimeline[]): Promise<boolean> {
    return false;
  }
}
