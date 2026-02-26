import type { laundryTimeline } from "#/db/schema";

type LaundryTimelineRow = typeof laundryTimeline.$inferSelect;

export abstract class LaundryTimelineScheduler {
  abstract evaluate(timelines: LaundryTimelineRow[]): Promise<boolean>;
}
