import { INestApplication } from "@nestjs/common";
import * as request from "supertest";

import { closeApp, getApp } from "../app.e2e";
import { StayApplyMock_User } from "../mocks/stay-apply-user.mock";
import { StaySeatPresetMock } from "../mocks/stay-seat-preset.mock";
import { StayMock } from "../mocks/stay.mock";
import { AdminUserMock, StudentUserMock } from "../mocks/user.mock";
import { UserMock } from "../types";

describe("stay", () => {
  let app: INestApplication;
  let admin: UserMock;
  let user: UserMock;
  let presetId: string;
  let stayId: string;

  beforeAll(async () => {
    app = await getApp();

    const adminMock = await AdminUserMock();
    admin = await adminMock.save();

    const userMock = await StudentUserMock();
    user = await userMock.save();

    presetId = (
      await request(app.getHttpServer())
        .post("/manage/stay/seat/preset")
        .auth(admin.jwt, { type: "bearer" })
        .send(StaySeatPresetMock())
        .expect(201)
    ).body.id;
    stayId = (
      await request(app.getHttpServer())
        .post("/manage/stay")
        .send(StayMock(presetId))
        .auth(admin.jwt, { type: "bearer" })
        .expect(201)
    ).body.id;
  });

  afterAll(async () => {
    await request(app.getHttpServer())
      .delete("/manage/stay")
      .query({ id: stayId })
      .auth(admin.jwt, { type: "bearer" })
      .expect(200);
    await request(app.getHttpServer())
      .delete("/manage/stay/seat/preset")
      .query({ id: presetId })
      .auth(admin.jwt, { type: "bearer" })
      .expect(200);

    await user.delete();
    await admin.delete();

    user = null;
    admin = null;

    await closeApp();
  });

  it("should defined", () => {
    expect(app).toBeDefined();
  });

  it("create stay apply", async () => {
    return request(app.getHttpServer())
      .post("/stay/apply")
      .send(StayApplyMock_User(stayId))
      .auth(user.jwt, { type: "bearer" })
      .expect(201)
      .then((res) => {
        expect(res.body.user.id).toBe(user.user.id);
      });
  });

  it("update stay apply", async () => {
    return request(app.getHttpServer())
      .patch("/stay/apply")
      .send(StayApplyMock_User(stayId))
      .auth(user.jwt, { type: "bearer" })
      .expect(200)
      .then((res) => {
        expect(res.body.user.id).toBe(user.user.id);
      });
  });

  it("delete stay apply", async () => {
    return request(app.getHttpServer())
      .delete("/stay/apply")
      .send({ id: stayId })
      .auth(user.jwt, { type: "bearer" })
      .expect(200)
      .then((res) => {
        expect(res.body.user.id).toBe(user.user.id);
      });
  });
});
