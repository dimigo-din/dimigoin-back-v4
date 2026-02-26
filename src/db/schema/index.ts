export * from "./auth.schema";
export * from "./facility.schema";
export * from "./frigo.schema";
export * from "./laundry.schema";
export * from "./meal.schema";
export * from "./push.schema";
export * from "./stay.schema";
export * from "./user.schema";
export * from "./validation.schema";
export * from "./wakeup.schema";

import type { login, session } from "./auth.schema";
import type { facilityImg, facilityReport, facilityReportComment } from "./facility.schema";
import type { frigoApply, frigoApplyPeriod } from "./frigo.schema";
import type { laundryApply, laundryMachine, laundryTime, laundryTimeline } from "./laundry.schema";
import type { meal, mealTimeline, mealTimelineDelay, mealTimelineSlot } from "./meal.schema";
import type { pushSubject, pushSubscription } from "./push.schema";
import type {
  stay,
  stayApply,
  stayApplyPeriodStay,
  stayApplyPeriodStaySchedule,
  stayOuting,
  staySchedule,
  staySeatPreset,
  staySeatPresetRange,
} from "./stay.schema";
import type { user } from "./user.schema";
import type { permissionValidator } from "./validation.schema";
import type { wakeupSongApplication, wakeupSongHistory, wakeupSongVote } from "./wakeup.schema";

export type User = typeof user.$inferSelect;
export type Login = typeof login.$inferSelect;
export type Session = typeof session.$inferSelect;
export type StaySeatPreset = typeof staySeatPreset.$inferSelect;
export type StaySeatPresetRange = typeof staySeatPresetRange.$inferSelect;
export type StaySchedule = typeof staySchedule.$inferSelect;
export type Stay = typeof stay.$inferSelect;
export type StayApplyPeriod_StaySchedule = typeof stayApplyPeriodStaySchedule.$inferSelect;
export type StayApplyPeriod_Stay = typeof stayApplyPeriodStay.$inferSelect;
export type StayApply = typeof stayApply.$inferSelect;
export type StayOuting = typeof stayOuting.$inferSelect;
export type LaundryTimeline = typeof laundryTimeline.$inferSelect;
export type LaundryTime = typeof laundryTime.$inferSelect;
export type LaundryMachine = typeof laundryMachine.$inferSelect;
export type LaundryApply = typeof laundryApply.$inferSelect;
export type WakeupSongApplication = typeof wakeupSongApplication.$inferSelect;
export type WakeupSongVote = typeof wakeupSongVote.$inferSelect;
export type WakeupSongHistory = typeof wakeupSongHistory.$inferSelect;
export type FacilityReport = typeof facilityReport.$inferSelect;
export type FacilityImg = typeof facilityImg.$inferSelect;
export type FacilityReportComment = typeof facilityReportComment.$inferSelect;
export type FrigoApplyPeriod = typeof frigoApplyPeriod.$inferSelect;
export type FrigoApply = typeof frigoApply.$inferSelect;
export type PushSubscription = typeof pushSubscription.$inferSelect;
export type PushSubject = typeof pushSubject.$inferSelect;
export type PermissionValidator = typeof permissionValidator.$inferSelect;
export type MealTimeline = typeof mealTimeline.$inferSelect;
export type MealTimelineSlot = typeof mealTimelineSlot.$inferSelect;
export type MealTimelineDelay = typeof mealTimelineDelay.$inferSelect;
export type Meal = typeof meal.$inferSelect;
