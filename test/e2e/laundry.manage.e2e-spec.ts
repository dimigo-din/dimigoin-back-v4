import { INestApplication } from "@nestjs/common";
import * as request from "supertest";

import { closeApp, getApp } from "../app.e2e";
import { StaySeatPresetMock } from "../mocks/stay-seat-preset.mock";
import { AdminUserMock, StudentUserMock } from "../mocks/user.mock";
import { UserMock } from "../types";

describe("laundry manage", () => {
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
    await closeApp();

    await user.delete();
    await admin.delete();

    user = null;
    admin = null;
  });

  it("should defined", () => {
    expect(app).toBeDefined();
  });

  it("create laundry timeline", async () => {
    return request(app.getHttpServer())
      .post("/manage/laundry/timeline")
      .auth(admin.jwt, { type: "bearer" })
      .send(StaySeatPresetMock())
      .expect(201)
      .then((res) => {
        expect(res.body.name).toBe("평상시");
      });
  });
});
