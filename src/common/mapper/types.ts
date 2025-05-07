import { User, PersonalInformationSchema } from "../../schemas";

export const LoginTypeValues = ["password", "google"] as const;
export type LoginType = (typeof LoginTypeValues)[number];

export const PermissionValidationTypeValues = ["permission", "permission_group"] as const;
export type PermissionValidationType = (typeof PermissionValidationTypeValues)[number];

export const GradeValues = [1, 2, 3] as const;
export type Grade = (typeof GradeValues)[number];

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

export const LaundryTimelineTriggerValues = ["primary", "stay"] as const;
export type LaundryTimelineTrigger = (typeof LaundryTimelineTriggerValues)[number];

/** 종례후, 저녁, 야자1후, 야자2후 */
export const FrigoTimingValues = [
  "afterschool",
  "dinner",
  "after_1st_study",
  "after_2nd_study",
] as const;
export type FrigoTiming = (typeof FrigoTimingValues)[number];

export type UserJWT = User & (PersonalInformationSchema & { sessionIdentifier?: string });
