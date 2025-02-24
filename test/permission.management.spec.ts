// import { describe, it, expect, jest } from "@jest/globals";
//
// import { CommonUserPermission, PermissionEnum } from "../src/common/mapper/permissions";
// import { hasPermission, numberPermission } from "../src/common/utils/permission.util";
//
// jest.useRealTimers();
//
// describe("Permission Management Test", () => {
//   it("Same Permission Test", () => {
//     const commonUserPermission = numberPermission(...CommonUserPermission);
//     expect(hasPermission(commonUserPermission, CommonUserPermission)).toBe(true);
//   });
//
//   it("Has Single Permission Test", () => {
//     const commonUserPermission = numberPermission(...CommonUserPermission);
//     expect(hasPermission(commonUserPermission, [PermissionEnum.GET_USER_SELF])).toBe(true);
//   });
//
//   it("Has Multiple Permission Test", () => {
//     const commonUserPermission = numberPermission(...CommonUserPermission);
//     expect(
//       hasPermission(commonUserPermission, [
//         PermissionEnum.GET_USER_SELF,
//         PermissionEnum.SEARCH_USER,
//         PermissionEnum.SEARCH_PROBLEM,
//         PermissionEnum.SEARCH_CLASS,
//       ]),
//     ).toBe(true);
//   });
//
//   it("Not Has Single Permission Test", () => {
//     const commonUserPermission = numberPermission(...CommonUserPermission);
//     expect(hasPermission(commonUserPermission, [PermissionEnum.MODIFY_CLASS])).toBe(false);
//   });
//
//   it("Not Has Multiple Permission Test", () => {
//     const commonUserPermission = numberPermission(...CommonUserPermission);
//     expect(
//       hasPermission(commonUserPermission, [
//         PermissionEnum.MODIFY_CLASS,
//         PermissionEnum.DELETE_USER,
//       ]),
//     ).toBe(false);
//   });
//
//   it("Mixed Permission Test", () => {
//     const commonUserPermission = numberPermission(...CommonUserPermission);
//     expect(
//       hasPermission(commonUserPermission, [
//         ...CommonUserPermission,
//         PermissionEnum.MODIFY_CLASS,
//         PermissionEnum.DELETE_USER,
//       ]),
//     ).toBe(false);
//   });
// });
