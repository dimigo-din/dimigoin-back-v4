import { LaundryTimelineScheduler } from "./scheduler.interface";
import { LaundryTimeline } from "../../../schemas";
import { Injectable } from "@nestjs/common";

@Injectable()
export class PrimaryScheduler extends LaundryTimelineScheduler {
  constructor() {
    super();
  }

  async evaluate(timelines: LaundryTimeline[]): Promise<boolean> {
    return true;
  }
}