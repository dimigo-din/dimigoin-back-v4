import { INestApplication } from "@nestjs/common";
import * as request from "supertest";

import { closeApp, getApp } from "../app.e2e";
import { FrigoApplyPeriodMock } from "../mocks/frigo-apply-period.mock";
import { FrigoApplyMock } from "../mocks/frigo-apply.mock";
import { AdminUserMock, StudentUserMock } from "../mocks/user.mock";
import { UserMock } from "../types";

describe("frigo manage", () => {
  let app: INestApplication;
  let admin: UserMock;
  let user: UserMock;
  let period_id;

  beforeAll(async () => {
    app = await getApp();

    const adminMock = await AdminUserMock();
    admin = await adminMock.save();

    const userMock = await StudentUserMock();
    user = await userMock.save();

    period_id = (
      await request(app.getHttpServer())
        .post("/manage/frigo/period")
        .auth(admin.jwt, { type: "bearer" })
        .send(FrigoApplyPeriodMock())
        .expect(201)
    ).body.data.id;
  });

  afterAll(async () => {
    await request(app.getHttpServer())
      .delete("/manage/frigo/period?id=" + period_id)
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

  it("get apply", async () => {
    return request(app.getHttpServer())
      .get("/frigo")
      .auth(user.jwt, { type: "bearer" })
      .expect(200)
      .then((res) => {
        expect(res.body.data).toBeNull();
      });
  });

  it("apply", async () => {
    return request(app.getHttpServer())
      .post("/frigo")
      .auth(user.jwt, { type: "bearer" })
      .send(FrigoApplyMock())
      .expect(201)
      .then((res) => {
        expect(res.body.data.reason).toBe("아니 십팔 집에가고싶다고.");
      });
  });

  it("get apply", async () => {
    return request(app.getHttpServer())
      .get("/frigo")
      .auth(user.jwt, { type: "bearer" })
      .then((res) => {
        expect(res.body.data).toBeTruthy();
      });
  });

  it("cancel", async () => {
    return request(app.getHttpServer())
      .delete("/frigo")
      .auth(user.jwt, { type: "bearer" })
      .then((res) => {
        expect(res.body.data).toBeTruthy();
      });
  });
});
