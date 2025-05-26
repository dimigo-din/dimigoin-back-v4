import { INestApplication } from "@nestjs/common";
import * as request from "supertest";

import { closeApp, getApp } from "../app.e2e";
import { FrigoApplyManageMock } from "../mocks/frigo-apply-manage.mock";
import { FrigoApplyPeriodMock } from "../mocks/frigo-apply-period.mock";
import { AdminUserMock, StudentUserMock } from "../mocks/user.mock";
import { UserMock } from "../types";

describe("frigo manage", () => {
  let app: INestApplication;
  let admin: UserMock;
  let user: UserMock;

  beforeAll(async () => {
    app = await getApp();

    const adminMock = await AdminUserMock();
    admin = await adminMock.save();

    const userMock = await StudentUserMock();
    user = await userMock.save();
  });

  afterAll(async () => {
    await user.delete();
    await admin.delete();

    user = null;
    admin = null;

    await closeApp();
  });

  it("should defined", () => {
    expect(app).toBeDefined();
  });

  let period_id;
  it("set apply period", async () => {
    return request(app.getHttpServer())
      .post("/manage/frigo/period")
      .auth(admin.jwt, { type: "bearer" })
      .send(FrigoApplyPeriodMock())
      .expect(201)
      .then((res) => {
        period_id = res.body.data.id;
        expect(res.body.data.grade).toBe(1);
      });
  });

  let frigo_id;
  it("apply", async () => {
    return request(app.getHttpServer())
      .post("/manage/frigo")
      .auth(admin.jwt, { type: "bearer" })
      .send(FrigoApplyManageMock(user.user.id))
      .expect(201)
      .then((res) => {
        frigo_id = res.body.data.id;
        expect(res.body.data.reason).toBe("집에가고싶어서");
        expect(res.body.data.approved).toBe(true);
      });
  });

  it("deny", async () => {
    return request(app.getHttpServer())
      .patch("/manage/frigo")
      .auth(admin.jwt, { type: "bearer" })
      .send({ id: frigo_id, audit_reason: "집보내주기싫어서", approved: false })
      .expect(200)
      .then((res) => {
        expect(res.body.data.audit_reason).toBe("집보내주기싫어서");
        expect(res.body.data.approved).toBe(false);
      });
  });

  it("delete apply", async () => {
    return request(app.getHttpServer())
      .delete("/manage/frigo")
      .query({ id: frigo_id })
      .auth(admin.jwt, { type: "bearer" })
      .expect(200)
      .then((res) => {
        expect(res.body.data.reason).toBe("집에가고싶어서");
      });
  });

  it("delete apply period", async () => {
    return request(app.getHttpServer())
      .delete("/manage/frigo/period")
      .query({ id: period_id })
      .auth(admin.jwt, { type: "bearer" })
      .expect(200)
      .then((res) => {
        expect(res.body.data.grade).toBe(1);
      });
  });
});
