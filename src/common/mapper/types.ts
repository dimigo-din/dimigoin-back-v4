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

export type UserJWT = User & (PersonalInformationSchema & { sessionIdentifier: string });
