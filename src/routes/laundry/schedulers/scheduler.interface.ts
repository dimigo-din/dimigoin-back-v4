import type { LaundryTimeline } from "../../../schemas";

export abstract class LaundryTimelineScheduler {
  abstract evaluate(timelines: LaundryTimeline[]): Promise<boolean>;
}
