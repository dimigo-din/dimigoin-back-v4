import { Injectable } from "@nestjs/common";
import { LaundryTimeline } from "../../../schemas";
import { LaundryTimelineScheduler } from "./scheduler.interface";

@Injectable()
export class EtcScheduler extends LaundryTimelineScheduler {
  async evaluate(timelines: LaundryTimeline[]): Promise<boolean> {
    // if the current schedule is etc, keep it.
    if (timelines.find((t) => t.enabled === true && t.scheduler === "etc")) {
      return true;
    } else {
      return false;
    }
  }
}
