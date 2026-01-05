import { INestApplication } from "@nestjs/common";
import { format } from "date-fns";
import * as request from "supertest";

import { closeApp, getApp } from "../app.e2e";
import { LaundryMachineMock } from "../mocks/laundry-machine.mock";
import { LaundryTimelineMock } from "../mocks/laundry-timeline.mock";
import { AdminUserMock, StudentUserMock } from "../mocks/user.mock";
import { UserMock } from "../types";

describe("laundry", () => {
  let app: INestApplication;
  let admin: UserMock;
  let user: UserMock;
  let machine_id;
  let timeline_id;
  let time_id;
  let apply_id;

  beforeAll(async () => {
    app = await getApp();

    const adminMock = await AdminUserMock();
    admin = await adminMock.save();

    const userMock = await StudentUserMock();
    user = await userMock.save();

    machine_id = (
      await request(app.getHttpServer())
        .post("/manage/laundry/machine")
        .auth(admin.jwt, { type: "bearer" })
        .send(LaundryMachineMock())
        .expect(201)
    ).body.data.id;
    const timelineBody = (
      await request(app.getHttpServer())
        .post("/manage/laundry/timeline")
        .auth(admin.jwt, { type: "bearer" })
        .send(LaundryTimelineMock([machine_id]))
        .expect(201)
    ).body;
    timeline_id = timelineBody.data.id;
    time_id = timelineBody.data.times[0].id;
    await request(app.getHttpServer())
      .patch("/manage/laundry/timeline/enable")
      .auth(admin.jwt, { type: "bearer" })
      .send({ id: timeline_id })
      .expect(200);
  });

  afterAll(async () => {
    await request(app.getHttpServer())
      .delete("/manage/laundry/timeline")
      .query({ id: timeline_id })
      .auth(admin.jwt, { type: "bearer" })
      .expect(200);
    await request(app.getHttpServer())
      .delete("/manage/laundry/machine")
      .query({ id: machine_id })
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

  it("get laundry timeline", async () => {
    return request(app.getHttpServer())
      .get("/laundry/timeline")
      .auth(user.jwt, { type: "bearer" })
      .expect(200)
      .then((res) => {
        expect(res.body.data.name).toBe("평상시");
      });
  });

  it("apply", async () => {
    return request(app.getHttpServer())
      .post("/laundry")
      .auth(user.jwt, { type: "bearer" })
      .send({ time: time_id, machine: machine_id })
      .expect(201)
      .then((res) => {
        expect(res.body.data.date).toBe(format(new Date(), "yyyy-MM-dd"));
      });
  });

  it("apply cancel", async () => {
    return request(app.getHttpServer())
      .delete("/laundry")
      .auth(user.jwt, { type: "bearer" })
      .expect(200)
      .then((res) => {
        expect(res.body.data.date).toBe(format(new Date(), "yyyy-MM-dd"));
      });
  });
});
