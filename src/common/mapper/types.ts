import type { User } from "#/db/schema";

export const LoginTypeValues = ["password", "google"] as const;
export type LoginType = (typeof LoginTypeValues)[number];

export const PermissionValidationTypeValues = ["permission", "permission_group"] as const;
export type PermissionValidationType = (typeof PermissionValidationTypeValues)[number];

export const GradeValues = [1, 2, 3] as const;
export type Grade = (typeof GradeValues)[number];

export const ClassValues = [1, 2, 3, 4, 5, 6] as const;
export type Class = (typeof ClassValues)[number];

export const GenderValues = ["male", "female"] as const;
export type Gender = (typeof GenderValues)[number];

export const StaySeatMappingValues = [
  "1_male",
  "1_female",
  "2_male",
  "2_female",
  "3_male",
  "3_female",
] as const;
export type StaySeatTargets = (typeof StaySeatMappingValues)[number];

export const LaundryMachineTypeValues = ["washer", "dryer"] as const;
export type LaundryMachineType = (typeof LaundryMachineTypeValues)[number];

export const LaundryTimelineSchedulerValues = ["primary", "stay", "vacation", "etc"] as const;
export type LaundryTimelineSchedule = (typeof LaundryTimelineSchedulerValues)[number];

/** 종례후, 저녁, 야자1후, 야자2후 */
export const FrigoTimingValues = [
  "afterschool",
  "dinner",
  "after_1st_study",
  "after_2nd_study",
] as const;
export type FrigoTiming = (typeof FrigoTimingValues)[number];

export const FacilityReportTypeValues = ["suggest", "broken", "danger"] as const;
export type FacilityReportType = (typeof FacilityReportTypeValues)[number];

/** 대기중, 검토중, 처리중, 완료, 무시됨, 실패 */
export const FacilityReportStatusValues = [
  "waiting",
  "under_review",
  "working",
  "done",
  "ignored",
  "failed",
] as const;
export type FacilityReportStatus = (typeof FacilityReportStatusValues)[number];

export const PushNotificationSubjectIdentifierValues = [
  "school_information",
  "laundry",
  "stay_apply_reminder",
  "wakeup_song",
];
export type PushNotificationSubjectIdentifier =
  (typeof PushNotificationSubjectIdentifierValues)[number];

export const PushNotificationSubject: Record<PushNotificationSubjectIdentifier, string> = {
  school_information: "학교 정보 알림",
  laundry: "세탁 알림",
  stay_apply_reminder: "잔류 신청 알림",
  wakeup_song: "오늘의 기상곡 알림",
};

export type UserJWT = User & { sessionIdentifier?: string };

export interface YoutubeVideoItem {
  kind: string;
  etag: string;
  id: {
    kind: string;
    videoId: string;
  };
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: {
      default: {
        url: string;
        width: number;
        height: number;
      };
      medium: {
        url: string;
        width: number;
        height: number;
      };
      high: {
        url: string;
        width: number;
        height: number;
      };
    };
    channelTitle: string;
    liveBroadcastContent: string;
    publishTime: string;
  };
}
export interface YoutubeSearchResults {
  kind: string;
  etag: string;
  nextPageToken: string;
  regionCode: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
  items: YoutubeVideoItem[];
}
