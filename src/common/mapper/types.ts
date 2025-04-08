import { User } from "../../schemas";
import { PersonalInformationSchema } from "../../schemas/personal-information.schema";

export const LoginTypeValues = ["password", "google"] as const;
export type LoginType = (typeof LoginTypeValues)[number];

export const PermissionValidationTypeValues = ["permission", "permission_group"] as const;
export type PermissionValidationType = (typeof PermissionValidationTypeValues)[number];

export const GradeValues = [1, 2, 3] as const;
export type Grade = (typeof GradeValues)[number];

export const GenderValues = ["male", "female"] as const;
export type Gender = (typeof GenderValues)[number];

export const StaySeatMappingValues = [
  "1st_male",
  "1st_female",
  "2nd_male",
  "2nd_female",
  "3rd_male",
  "3rd_female",
] as const;
export type StaySeatTargets = (typeof StaySeatMappingValues)[number];

export type UserJWT = User & (PersonalInformationSchema & { sessionIdentifier: string });
