export const LoginTypeValues = ["password", "google"] as const;
export type LoginType = (typeof LoginTypeValues)[number];

export const PermissionValidationTypeValues = ["permission", "permission_group"] as const;
export type PermissionValidationType = (typeof PermissionValidationTypeValues)[number];

export const GradeValues = [1, 2, 3] as const;
export type Grade = (typeof GradeValues)[number];

export const StaySeatMappingValues = [
  "1st_male",
  "1st_female",
  "2nd_male",
  "2nd_female",
  "3rd_male",
  "3rd_female",
] as const;
export type StaySeatTargets = (typeof StaySeatMappingValues)[number];

export type UserJWT = {
  id: string;
  email: string;
  name: string;
  nickname: string;
  lvl: number;
  rating: number;
  permission: number;
  refresh: boolean;
  sessionIdentifier: string;
};
