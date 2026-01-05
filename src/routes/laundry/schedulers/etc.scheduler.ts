import { LaundryTimelineScheduler } from "./scheduler.interface";
import { LaundryTimeline } from "../../../schemas";
import { Injectable } from "@nestjs/common";

@Injectable()
export class EtcScheduler extends LaundryTimelineScheduler {
  constructor() {
    super();
  }

  async evaluate(timelines: LaundryTimeline[]): Promise<boolean> {
    // if the current schedule is etc, keep it.
    if (timelines.find((t) => t.enabled === true && t.scheduler === "etc")) return true;
    else return false;
  }
}
