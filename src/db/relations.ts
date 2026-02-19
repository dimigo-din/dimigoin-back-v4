import { defineRelations } from "drizzle-orm";
import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
  // User relations
  user: {
    login: r.many.login(),
    session: r.many.session(),
    stayApply: r.many.stayApply(),
    laundryApply: r.many.laundryApply(),
    frigoApply: r.many.frigoApply(),
    facilityReport: r.many.facilityReport(),
    facilityReportComment: r.many.facilityReportComment(),
    wakeupSongApplication: r.many.wakeupSongApplication(),
    wakeupSongVote: r.many.wakeupSongVote(),
    pushSubscription: r.many.pushSubscription(),
    pushSubject: r.many.pushSubject(),
  },

  // Auth relations
  login: {
    user: r.one.user({
      from: r.login.userId,
      to: r.user.id,
    }),
  },
  session: {
    user: r.one.user({
      from: r.session.userId,
      to: r.user.id,
    }),
  },

  // Stay relations
  staySeatPreset: {
    staySeatPresetRange: r.many.staySeatPresetRange(),
    staySchedule: r.many.staySchedule(),
    stay: r.many.stay(),
  },
  staySeatPresetRange: {
    staySeatPreset: r.one.staySeatPreset({
      from: r.staySeatPresetRange.staySeatPresetId,
      to: r.staySeatPreset.id,
    }),
  },
  staySchedule: {
    staySeatPreset: r.one.staySeatPreset({
      from: r.staySchedule.staySeatPresetId,
      to: r.staySeatPreset.id,
    }),
    stayApplyPeriodStaySchedule: r.many.stayApplyPeriodStaySchedule(),
    children: r.many.stay(),
  },
  stay: {
    staySeatPreset: r.one.staySeatPreset({
      from: r.stay.staySeatPresetId,
      to: r.staySeatPreset.id,
    }),
    parent: r.one.staySchedule({
      from: r.stay.parentId,
      to: r.staySchedule.id,
    }),
    stayApplyPeriodStay: r.many.stayApplyPeriodStay(),
    stayApply: r.many.stayApply(),
  },
  stayApplyPeriodStaySchedule: {
    staySchedule: r.one.staySchedule({
      from: r.stayApplyPeriodStaySchedule.stayScheduleId,
      to: r.staySchedule.id,
    }),
  },
  stayApplyPeriodStay: {
    stay: r.one.stay({
      from: r.stayApplyPeriodStay.stayId,
      to: r.stay.id,
    }),
  },
  stayApply: {
    stay: r.one.stay({
      from: r.stayApply.stayId,
      to: r.stay.id,
    }),
    user: r.one.user({
      from: r.stayApply.userId,
      to: r.user.id,
    }),
    outing: r.many.stayOuting(),
  },
  stayOuting: {
    stayApply: r.one.stayApply({
      from: r.stayOuting.stayApplyId,
      to: r.stayApply.id,
    }),
  },

  // Laundry relations
  laundryTimeline: {
    times: r.many.laundryTime(),
    applies: r.many.laundryApply(),
  },
  laundryTime: {
    timeline: r.one.laundryTimeline({
      from: r.laundryTime.timelineId,
      to: r.laundryTimeline.id,
    }),
    assigns: r.many.laundryTimeToMachine(),
    applies: r.many.laundryApply(),
  },
  laundryMachine: {
    applies: r.many.laundryApply(),
    assigns: r.many.laundryTimeToMachine(),
  },
  laundryTimeToMachine: {
    laundryTime: r.one.laundryTime({
      from: r.laundryTimeToMachine.laundryTimeId,
      to: r.laundryTime.id,
    }),
    laundryMachine: r.one.laundryMachine({
      from: r.laundryTimeToMachine.laundryMachineId,
      to: r.laundryMachine.id,
    }),
  },
  laundryApply: {
    laundryTimeline: r.one.laundryTimeline({
      from: r.laundryApply.laundryTimelineId,
      to: r.laundryTimeline.id,
    }),
    laundryTime: r.one.laundryTime({
      from: r.laundryApply.laundryTimeId,
      to: r.laundryTime.id,
    }),
    laundryMachine: r.one.laundryMachine({
      from: r.laundryApply.laundryMachineId,
      to: r.laundryMachine.id,
    }),
    user: r.one.user({
      from: r.laundryApply.userId,
      to: r.user.id,
    }),
  },

  // Wakeup relations
  wakeupSongApplication: {
    wakeupSongVote: r.many.wakeupSongVote(),
    user: r.one.user({
      from: r.wakeupSongApplication.userId,
      to: r.user.id,
    }),
  },
  wakeupSongVote: {
    wakeupSongApplication: r.one.wakeupSongApplication({
      from: r.wakeupSongVote.wakeupSongApplicationId,
      to: r.wakeupSongApplication.id,
    }),
    user: r.one.user({
      from: r.wakeupSongVote.userId,
      to: r.user.id,
    }),
  },

  // Frigo relations
  frigoApply: {
    user: r.one.user({
      from: r.frigoApply.userId,
      to: r.user.id,
    }),
  },

  // Facility relations
  facilityReport: {
    comment: r.many.facilityReportComment(),
    file: r.many.facilityImg(),
    user: r.one.user({
      from: r.facilityReport.userId,
      to: r.user.id,
    }),
  },
  facilityImg: {
    parent: r.one.facilityReport({
      from: r.facilityImg.parentId,
      to: r.facilityReport.id,
    }),
  },
  facilityReportComment: {
    commentParent: r.one.facilityReportComment({
      from: r.facilityReportComment.commentParentId,
      to: r.facilityReportComment.id,
    }),
    parent: r.one.facilityReport({
      from: r.facilityReportComment.parentId,
      to: r.facilityReport.id,
    }),
    user: r.one.user({
      from: r.facilityReportComment.userId,
      to: r.user.id,
    }),
  },

  // Meal relations
  mealTimeline: {
    slots: r.many.mealTimelineSlot(),
    delays: r.many.mealTimelineDelay(),
  },
  mealTimelineSlot: {
    timeline: r.one.mealTimeline({
      from: r.mealTimelineSlot.timelineId,
      to: r.mealTimeline.id,
    }),
  },
  mealTimelineDelay: {
    timeline: r.one.mealTimeline({
      from: r.mealTimelineDelay.timelineId,
      to: r.mealTimeline.id,
    }),
  },

  // Push relations
  pushSubscription: {
    subjects: r.many.pushSubject(),
    user: r.one.user({
      from: r.pushSubscription.userId,
      to: r.user.id,
    }),
  },
  pushSubject: {
    subscription: r.one.pushSubscription({
      from: r.pushSubject.subscriptionId,
      to: r.pushSubscription.id,
    }),
    user: r.one.user({
      from: r.pushSubject.userId,
      to: r.user.id,
    }),
  },
}));
