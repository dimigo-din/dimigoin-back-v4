import { INestApplication } from "@nestjs/common";
import * as request from "supertest";

import { getApp } from "../app.e2e";
import { StaySeatPresetMock } from "../mocks/stay-seat-preset.mock";
import { AdminUserMock, StudentUserMock } from "../mocks/user.mock";
import { UserMock } from "../types";

describe("Stay Manage", () => {
  let app: INestApplication;
  let admin: UserMock;
  let user: UserMock;

  beforeAll(async () => {
    app = await getApp();

    const adminMock = await AdminUserMock;
    await adminMock.save();
    admin = adminMock;

    const userMock = await StudentUserMock;
    await userMock.save();
    user = userMock;
  });

  it("should defined", () => {
    expect(app).toBeDefined();
  });

  it("stay seat preset create", async () => {
    return request(app.getHttpServer())
      .post("/manage/stay/seat/preset")
      .auth(admin.jwt, { type: "bearer" })
      .send(StaySeatPresetMock)
      .expect("Content-Type", /json/)
      .expect(201)
      .then((res) => {
        expect(res.body.name).toBe("평상시");
      });
  });

  let id;
  it("stay seat preset list", async () => {
    return request(app.getHttpServer())
      .get("/manage/stay/seat/preset/list")
      .auth(admin.jwt, { type: "bearer" })
      .expect("Content-Type", /json/)
      .expect(200)
      .then((res) => {
        id = res.body[0];
        expect(res.body[0].name).toBe("평상시");
      });
  });

  it("stay seat preset get", async () => {
    return request(app.getHttpServer())
      .get("/manage/stay/seat/preset")
      .query({ id })
      .auth(admin.jwt, { type: "bearer" })
      .expect("Content-Type", /json/)
      .expect(200)
      .then((res) => {
        expect(res.body.name).toBe("평상시");
      });
  });

  it("stay schedule create", () => {});
});
