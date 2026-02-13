import { mock } from "bun:test";
import { generateKeyPairSync } from "node:crypto";
import { NotFoundException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { NestFastifyApplication } from "@nestjs/platform-fastify";
import type { Session, User } from "#/db/schema";
import { JWTResponse } from "#auth/auth.dto";
import { AuthService } from "#auth/auth.service";
import { TestApp } from "#test/helpers/app.helper";
import { RequestHelper } from "#test/helpers/request.helper";
import { PermissionEnum, StudentUserPermission } from "$mapper/permissions";
import { numberPermission } from "$utils/permission.util";
import { FacilityManageService, FacilityStudentService } from "~facility/providers";
import { FrigoManageService, FrigoStudentService } from "~frigo/providers";
import { LaundryManageService, LaundryStudentService } from "~laundry/providers";
import { PushManageService, PushStudentService } from "~push/providers";
import { StayManageService, StayStudentService } from "~stay/providers";
import { UserManageService, UserStudentService } from "~user/providers";
import { WakeupManageService, WakeupService, WakeupStudentService } from "~wakeup/providers";

type AuthTokens = {
  student: JWTResponse;
  teacher: JWTResponse;
};

interface AuthSetupResult {
  tokens: AuthTokens;
  sessionStore: Session[];
}

export interface E2EContext {
  testApp: TestApp;
  app: NestFastifyApplication;
  request: RequestHelper;
  tokens: AuthTokens;
  sessionStore: Session[];
}

const ensureJwtKeys = () => {
  if (!Bun.env.JWT_PRIVATE || !Bun.env.JWT_PUBLIC) {
    const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
    Bun.env.JWT_PRIVATE = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
    Bun.env.JWT_PUBLIC = publicKey.export({ type: "spki", format: "pem" }).toString();
  }
};

const createUsers = () => {
  const studentUser: User = {
    id: "student-1",
    email: "student$test.com",
    name: "Student User",
    picture: "pic",
    permission: numberPermission(...StudentUserPermission).toString(),
  } as User;

  const teacherUser: User = {
    id: "teacher-1",
    email: "teacher$test.com",
    name: "Teacher User",
    picture: "pic",
    permission: numberPermission(
      PermissionEnum.TEACHER,
      PermissionEnum.MANAGE_PERMISSION,
    ).toString(),
  } as User;

  return { studentUser, teacherUser };
};

const setupAuthMocks = async (
  app: NestFastifyApplication,
  request: RequestHelper,
): Promise<AuthSetupResult> => {
  const { studentUser, teacherUser } = createUsers();
  const authService = app.get(AuthService);
  const jwtService = app.get(JwtService);
  const sessionStore: Session[] = [];

  authService.loginByIdPassword = mock(async (id: string, _password: string) => {
    const user =
      id === studentUser.email ? studentUser : id === teacherUser.email ? teacherUser : null;
    if (!user) {
      throw new Error("User not found");
    }

    const sessionIdentifier = Bun.randomUUIDv7();
    const keyPair = {
      accessToken: await jwtService.signAsync({ sessionIdentifier, ...user }, { expiresIn: "30m" }),
      refreshToken: Bun.randomUUIDv7(),
    };
    sessionStore.push({
      id: Bun.randomUUIDv7(),
      refreshToken: keyPair.refreshToken,
      sessionIdentifier,
      userId: user.id,
      created_at: new Date(),
      updated_at: new Date(),
    } as Session);
    return keyPair;
  }) as typeof authService.loginByIdPassword;

  authService.refresh = mock(async (refreshToken: string) => {
    const sessionRecord = sessionStore.find((s) => s.refreshToken === refreshToken);
    if (!sessionRecord) {
      throw new NotFoundException("Session not found");
    }

    const user =
      sessionRecord.userId === studentUser.id
        ? studentUser
        : sessionRecord.userId === teacherUser.id
          ? teacherUser
          : null;
    if (!user) {
      throw new NotFoundException("User not found");
    }

    const sessionIdentifier = Bun.randomUUIDv7();
    const keyPair = {
      accessToken: await jwtService.signAsync({ sessionIdentifier, ...user }, { expiresIn: "30m" }),
      refreshToken: Bun.randomUUIDv7(),
    };

    sessionRecord.refreshToken = keyPair.refreshToken;
    sessionRecord.sessionIdentifier = sessionIdentifier;
    sessionRecord.updated_at = new Date();

    return keyPair;
  }) as typeof authService.refresh;

  authService.logout = mock(async (userJwt: { sessionIdentifier: string }) => {
    const idx = sessionStore.findIndex((s) => s.sessionIdentifier === userJwt.sessionIdentifier);
    if (idx < 0) {
      throw new Error("Session not found");
    }
    const [removed] = sessionStore.splice(idx, 1);
    return removed;
  }) as typeof authService.logout;

  const studentLoginResponse = await request.post("/auth/login/password", {
    email: studentUser.email,
    password: "test-password",
  });
  const teacherLoginResponse = await request.post("/auth/login/password", {
    email: teacherUser.email,
    password: "test-password",
  });

  const studentBody = request.parseBody<{ data: JWTResponse }>(studentLoginResponse);
  const teacherBody = request.parseBody<{ data: JWTResponse }>(teacherLoginResponse);

  return {
    tokens: { student: studentBody.data, teacher: teacherBody.data },
    sessionStore,
  };
};

const stubMethod = <T extends object, K extends keyof T>(target: T | null, key: K, impl: T[K]) => {
  if (!target) {
    return;
  }
  (target as Record<K, T[K]>)[key] = impl;
};

const stubProtoMethod = <T extends object, K extends keyof T>(
  target: T | null,
  key: K,
  impl: T[K],
) => {
  if (!target) {
    return;
  }
  const proto = Object.getPrototypeOf(target) as Record<K, T[K]>;
  proto[key] = impl;
};

const stubDomainServices = (app: NestFastifyApplication) => {
  const stayStudentService = app.get(StayStudentService);
  const stayManageService = app.get(StayManageService);
  const frigoManageService = app.get(FrigoManageService);
  const frigoStudentService = app.get(FrigoStudentService);
  const facilityStudentService = app.get(FacilityStudentService);
  const facilityManageService = app.get(FacilityManageService);
  const laundryStudentService = app.get(LaundryStudentService);
  const laundryManageService = app.get(LaundryManageService);
  const pushStudentService = app.get(PushStudentService);
  const pushManageService = app.get(PushManageService);
  const wakeupService = app.get(WakeupService);
  const wakeupStudentService = app.get(WakeupStudentService);
  const wakeupManageService = app.get(WakeupManageService);
  const userManageService = app.get(UserManageService);
  const userStudentService = app.get(UserStudentService);

  stubMethod(
    stayStudentService,
    "getStayList",
    mock(async () => []) as unknown as (typeof stayStudentService)["getStayList"],
  );
  stubMethod(
    stayStudentService,
    "getStayApplies",
    mock(async () => []) as unknown as (typeof stayStudentService)["getStayApplies"],
  );
  stubMethod(
    stayStudentService,
    "createStayApply",
    mock(async () => ({
      id: "stay-apply-1",
    })) as unknown as (typeof stayStudentService)["createStayApply"],
  );
  stubMethod(
    stayStudentService,
    "updateStayApply",
    mock(async () => ({
      id: "stay-apply-1",
    })) as unknown as (typeof stayStudentService)["updateStayApply"],
  );
  stubMethod(
    stayStudentService,
    "deleteStayApply",
    mock(async () => ({
      id: "stay-apply-1",
    })) as unknown as (typeof stayStudentService)["deleteStayApply"],
  );
  stubMethod(
    stayStudentService,
    "getStayOuting",
    mock(async () => []) as unknown as (typeof stayStudentService)["getStayOuting"],
  );
  stubMethod(
    stayStudentService,
    "addStayOuting",
    mock(async () => ({
      id: "outing-1",
    })) as unknown as (typeof stayStudentService)["addStayOuting"],
  );
  stubMethod(
    stayStudentService,
    "editStayOuting",
    mock(async () => ({
      id: "outing-1",
    })) as unknown as (typeof stayStudentService)["editStayOuting"],
  );
  stubMethod(
    stayStudentService,
    "removeStayOuting",
    mock(async () => ({
      id: "outing-1",
    })) as unknown as (typeof stayStudentService)["removeStayOuting"],
  );
  stubMethod(
    stayManageService,
    "getStayList",
    mock(async () => []) as unknown as (typeof stayManageService)["getStayList"],
  );
  stubMethod(
    stayManageService,
    "createStay",
    mock(async () => ({ id: "stay-1" })) as unknown as (typeof stayManageService)["createStay"],
  );
  stubMethod(
    stayManageService,
    "getStay",
    mock(async () => ({ id: "stay-1" })) as unknown as (typeof stayManageService)["getStay"],
  );
  stubMethod(
    stayManageService,
    "getStaySeatPresetList",
    mock(async () => []) as unknown as (typeof stayManageService)["getStaySeatPresetList"],
  );
  stubMethod(
    stayManageService,
    "getStaySeatPreset",
    mock(async () => ({
      id: "preset-1",
    })) as unknown as (typeof stayManageService)["getStaySeatPreset"],
  );
  stubMethod(
    stayManageService,
    "createStaySeatPreset",
    mock(async () => ({
      id: "preset-1",
    })) as unknown as (typeof stayManageService)["createStaySeatPreset"],
  );
  stubMethod(
    stayManageService,
    "updateStaySeatPreset",
    mock(async () => ({
      id: "preset-1",
    })) as unknown as (typeof stayManageService)["updateStaySeatPreset"],
  );
  stubMethod(
    stayManageService,
    "deleteStaySeatPreset",
    mock(async () => ({
      id: "preset-1",
    })) as unknown as (typeof stayManageService)["deleteStaySeatPreset"],
  );
  stubMethod(
    stayManageService,
    "getStayScheduleList",
    mock(async () => []) as unknown as (typeof stayManageService)["getStayScheduleList"],
  );
  stubMethod(
    stayManageService,
    "getStaySchedule",
    mock(async () => ({
      id: "schedule-1",
    })) as unknown as (typeof stayManageService)["getStaySchedule"],
  );
  stubMethod(
    stayManageService,
    "createStaySchedule",
    mock(async () => ({
      id: "schedule-1",
    })) as unknown as (typeof stayManageService)["createStaySchedule"],
  );
  stubMethod(
    stayManageService,
    "updateStaySchedule",
    mock(async () => ({
      id: "schedule-1",
    })) as unknown as (typeof stayManageService)["updateStaySchedule"],
  );
  stubMethod(
    stayManageService,
    "deleteStaySchedule",
    mock(async () => ({
      id: "schedule-1",
    })) as unknown as (typeof stayManageService)["deleteStaySchedule"],
  );
  stubMethod(
    stayManageService,
    "updateStay",
    mock(async () => ({ id: "stay-1" })) as unknown as (typeof stayManageService)["updateStay"],
  );
  stubMethod(
    stayManageService,
    "deleteStay",
    mock(async () => ({ id: "stay-1" })) as unknown as (typeof stayManageService)["deleteStay"],
  );
  stubMethod(
    stayManageService,
    "getStayApply",
    mock(async () => []) as unknown as (typeof stayManageService)["getStayApply"],
  );
  stubMethod(
    stayManageService,
    "createStayApply",
    mock(async () => ({
      id: "stay-apply-1",
    })) as unknown as (typeof stayManageService)["createStayApply"],
  );
  stubMethod(
    stayManageService,
    "updateStayApply",
    mock(async () => ({
      id: "stay-apply-1",
    })) as unknown as (typeof stayManageService)["updateStayApply"],
  );
  stubMethod(
    stayManageService,
    "deleteStayApply",
    mock(async () => ({
      id: "stay-apply-1",
    })) as unknown as (typeof stayManageService)["deleteStayApply"],
  );
  stubMethod(
    stayManageService,
    "auditOuting",
    mock(async () => ({ id: "outing-1" })) as unknown as (typeof stayManageService)["auditOuting"],
  );
  stubMethod(
    stayManageService,
    "updateOutingMealCancel",
    mock(async () => ({
      id: "outing-1",
    })) as unknown as (typeof stayManageService)["updateOutingMealCancel"],
  );
  stubMethod(
    stayManageService,
    "moveToSomewhere",
    mock(async () => []) as unknown as (typeof stayManageService)["moveToSomewhere"],
  );

  stubMethod(
    frigoManageService,
    "getApplyPeriod",
    mock(async () => []) as unknown as (typeof frigoManageService)["getApplyPeriod"],
  );
  stubMethod(
    frigoManageService,
    "getApplyList",
    mock(async () => []) as unknown as (typeof frigoManageService)["getApplyList"],
  );
  stubMethod(
    frigoManageService,
    "setApplyPeriod",
    mock(async () => ({
      id: "period-1",
    })) as unknown as (typeof frigoManageService)["setApplyPeriod"],
  );
  stubMethod(
    frigoManageService,
    "removeApplyPeriod",
    mock(async () => ({
      id: "period-1",
    })) as unknown as (typeof frigoManageService)["removeApplyPeriod"],
  );
  stubMethod(
    frigoManageService,
    "apply",
    mock(async () => ({ id: "frigo-apply-1" })) as unknown as (typeof frigoManageService)["apply"],
  );
  stubMethod(
    frigoManageService,
    "removeApply",
    mock(async () => ({
      id: "frigo-apply-1",
    })) as unknown as (typeof frigoManageService)["removeApply"],
  );
  stubMethod(
    frigoManageService,
    "auditApply",
    mock(async () => ({
      id: "frigo-apply-1",
    })) as unknown as (typeof frigoManageService)["auditApply"],
  );
  stubMethod(
    frigoStudentService,
    "getApply",
    mock(async () => ({})) as unknown as (typeof frigoStudentService)["getApply"],
  );
  stubMethod(
    frigoStudentService,
    "frigoApply",
    mock(async () => ({
      id: "frigo-apply-1",
    })) as unknown as (typeof frigoStudentService)["frigoApply"],
  );
  stubMethod(
    frigoStudentService,
    "cancelApply",
    mock(async () => ({
      id: "frigo-apply-1",
    })) as unknown as (typeof frigoStudentService)["cancelApply"],
  );

  stubMethod(
    facilityStudentService,
    "reportList",
    mock(async () => []) as unknown as (typeof facilityStudentService)["reportList"],
  );
  stubMethod(
    facilityStudentService,
    "getReport",
    mock(async () => ({
      id: "facility-1",
    })) as unknown as (typeof facilityStudentService)["getReport"],
  );
  stubMethod(
    facilityStudentService,
    "getImg",
    mock(async () => ({
      filename: "facility.jpg",
      stream: "binary",
    })) as unknown as (typeof facilityStudentService)["getImg"],
  );
  stubMethod(
    facilityStudentService,
    "createReport",
    mock(async () => ({
      id: "facility-1",
    })) as unknown as (typeof facilityStudentService)["createReport"],
  );
  stubMethod(
    facilityStudentService,
    "writeComment",
    mock(async () => ({
      id: "comment-1",
    })) as unknown as (typeof facilityStudentService)["writeComment"],
  );
  stubMethod(
    facilityManageService,
    "getImg",
    mock(async () => ({
      filename: "facility.jpg",
      stream: "binary",
    })) as unknown as (typeof facilityManageService)["getImg"],
  );
  stubMethod(
    facilityManageService,
    "deleteImg",
    mock(async () => ({ id: "img-1" })) as unknown as (typeof facilityManageService)["deleteImg"],
  );
  stubMethod(
    facilityManageService,
    "reportList",
    mock(async () => []) as unknown as (typeof facilityManageService)["reportList"],
  );
  stubMethod(
    facilityManageService,
    "getReport",
    mock(async () => ({
      id: "facility-1",
    })) as unknown as (typeof facilityManageService)["getReport"],
  );
  stubMethod(
    facilityManageService,
    "createReport",
    mock(async () => ({
      id: "facility-1",
    })) as unknown as (typeof facilityManageService)["createReport"],
  );
  stubMethod(
    facilityManageService,
    "deleteReport",
    mock(async () => ({
      id: "facility-1",
    })) as unknown as (typeof facilityManageService)["deleteReport"],
  );
  stubMethod(
    facilityManageService,
    "writeComment",
    mock(async () => ({
      id: "comment-1",
    })) as unknown as (typeof facilityManageService)["writeComment"],
  );
  stubMethod(
    facilityManageService,
    "deleteComment",
    mock(async () => ({
      id: "comment-1",
    })) as unknown as (typeof facilityManageService)["deleteComment"],
  );
  stubMethod(
    facilityManageService,
    "changeType",
    mock(async () => ({
      id: "facility-1",
    })) as unknown as (typeof facilityManageService)["changeType"],
  );
  stubMethod(
    facilityManageService,
    "changeStatus",
    mock(async () => ({
      id: "facility-1",
    })) as unknown as (typeof facilityManageService)["changeStatus"],
  );

  stubMethod(
    laundryStudentService,
    "getTimeline",
    mock(async () => []) as unknown as (typeof laundryStudentService)["getTimeline"],
  );
  stubMethod(
    laundryStudentService,
    "getApplies",
    mock(async () => []) as unknown as (typeof laundryStudentService)["getApplies"],
  );
  stubMethod(
    laundryStudentService,
    "createApply",
    mock(async () => ({
      id: "laundry-apply-1",
    })) as unknown as (typeof laundryStudentService)["createApply"],
  );
  stubMethod(
    laundryStudentService,
    "deleteApply",
    mock(async () => ({
      id: "laundry-apply-1",
    })) as unknown as (typeof laundryStudentService)["deleteApply"],
  );
  stubMethod(
    laundryManageService,
    "getLaundryMachineList",
    mock(async () => []) as unknown as (typeof laundryManageService)["getLaundryMachineList"],
  );
  stubMethod(
    laundryManageService,
    "createLaundryMachine",
    mock(async () => ({
      id: "machine-1",
    })) as unknown as (typeof laundryManageService)["createLaundryMachine"],
  );

  stubMethod(
    pushStudentService,
    "getSubjects",
    mock(async () => [
      { identifier: "notice", name: "Notice" },
    ]) as unknown as (typeof pushStudentService)["getSubjects"],
  );
  stubMethod(
    pushStudentService,
    "removeToken",
    mock(async () => ({ removed: true })) as unknown as (typeof pushStudentService)["removeToken"],
  );
  stubMethod(
    pushStudentService,
    "removeAllByUser",
    mock(async () => []) as unknown as (typeof pushStudentService)["removeAllByUser"],
  );
  stubMethod(
    pushStudentService,
    "getSubscribedSubject",
    mock(async () => []) as unknown as (typeof pushStudentService)["getSubscribedSubject"],
  );
  stubMethod(
    pushStudentService,
    "setSubscribeSubject",
    mock(async () => []) as unknown as (typeof pushStudentService)["setSubscribeSubject"],
  );
  stubMethod(
    pushStudentService,
    "upsertToken",
    mock(async () => ({
      token: "test-fcm-token",
    })) as unknown as (typeof pushStudentService)["upsertToken"],
  );
  stubMethod(
    pushManageService,
    "sendToAll",
    mock(async () => ({
      sent: 0,
      failed: 0,
    })) as unknown as (typeof pushManageService)["sendToAll"],
  );
  stubMethod(
    pushManageService,
    "sendToSpecificUsers",
    mock(async () => ({
      sent: 0,
      failed: 0,
    })) as unknown as (typeof pushManageService)["sendToSpecificUsers"],
  );
  stubMethod(
    pushManageService,
    "getSubscriptionsByUser",
    mock(async () => []) as unknown as (typeof pushManageService)["getSubscriptionsByUser"],
  );

  stubMethod(
    wakeupService,
    "getDateSong",
    mock(async () => ({
      title: "Test Song",
      channel: "Test Channel",
      url: "https://youtube.com/watch?v=test",
      id: "test",
    })) as unknown as (typeof wakeupService)["getDateSong"],
  );
  stubMethod(
    wakeupStudentService,
    "search",
    mock(async () => ({ items: [] })) as unknown as (typeof wakeupStudentService)["search"],
  );
  stubMethod(
    wakeupStudentService,
    "getApplications",
    mock(async () => []) as unknown as (typeof wakeupStudentService)["getApplications"],
  );
  stubMethod(
    wakeupStudentService,
    "registerVideo",
    mock(async () => ({
      id: "wakeup-apply-1",
    })) as unknown as (typeof wakeupStudentService)["registerVideo"],
  );
  stubMethod(
    wakeupStudentService,
    "getMyVotes",
    mock(async () => []) as unknown as (typeof wakeupStudentService)["getMyVotes"],
  );
  stubMethod(
    wakeupStudentService,
    "vote",
    mock(async () => ({ id: "vote-1" })) as unknown as (typeof wakeupStudentService)["vote"],
  );
  stubMethod(
    wakeupStudentService,
    "unVote",
    mock(async () => ({ id: "vote-1" })) as unknown as (typeof wakeupStudentService)["unVote"],
  );
  stubMethod(
    wakeupManageService,
    "getList",
    mock(async () => []) as unknown as (typeof wakeupManageService)["getList"],
  );
  stubMethod(
    wakeupManageService,
    "selectApply",
    mock(async () => ({
      id: "wakeup-1",
    })) as unknown as (typeof wakeupManageService)["selectApply"],
  );
  stubMethod(
    wakeupManageService,
    "deleteApply",
    mock(async () => ({
      id: "wakeup-1",
    })) as unknown as (typeof wakeupManageService)["deleteApply"],
  );

  stubProtoMethod(
    userManageService,
    "searchUser",
    mock(async () => []) as unknown as (typeof userManageService)["searchUser"],
  );
  stubProtoMethod(
    userManageService,
    "addPasswordLogin",
    mock(async () => ({ ok: true })) as unknown as (typeof userManageService)["addPasswordLogin"],
  );
  stubProtoMethod(
    userManageService,
    "setPermission",
    mock(async () => ({ id: "user-1" })) as unknown as (typeof userManageService)["setPermission"],
  );
  stubProtoMethod(
    userManageService,
    "addPermission",
    mock(async () => ({ id: "user-1" })) as unknown as (typeof userManageService)["addPermission"],
  );
  stubProtoMethod(
    userManageService,
    "removePermission",
    mock(async () => ({
      id: "user-1",
    })) as unknown as (typeof userManageService)["removePermission"],
  );
  stubProtoMethod(
    userManageService,
    "checkUserDetail",
    mock(async () => null) as unknown as (typeof userManageService)["checkUserDetail"],
  );
  stubProtoMethod(
    userStudentService,
    "getTimeTable",
    mock(async () => []) as unknown as (typeof userStudentService)["getTimeTable"],
  );
  stubProtoMethod(
    userStudentService,
    "getMyApplies",
    mock(async () => ({
      stayApply: null,
      laundryApply: null,
    })) as unknown as (typeof userStudentService)["getMyApplies"],
  );
};

export const setupE2EContext = async (): Promise<E2EContext> => {
  ensureJwtKeys();

  const testApp = new TestApp();
  const app = await testApp.initialize();
  const request = new RequestHelper(app);

  const { tokens, sessionStore } = await setupAuthMocks(app, request);
  stubDomainServices(app);

  return { testApp, app, request, tokens, sessionStore };
};
