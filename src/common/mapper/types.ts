export const LoginTypeValues = ["password", "google"] as const;
export type LoginType = (typeof LoginTypeValues)[number];

export const PermissionValidationTypeValues = ["permission", "permission_group"] as const;
export type PermissionValidationType = (typeof PermissionValidationTypeValues)[number];

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
