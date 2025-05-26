import { INestApplication } from "@nestjs/common";
import * as moment from "moment";
import * as request from "supertest";

import { closeApp, getApp } from "../app.e2e";
import { LaundryApplyMock } from "../mocks/laundry-apply.mock";
import { LaundryMachineMock } from "../mocks/laundry-machine.mock";
import { LaundryTimelineMock } from "../mocks/laundry-timeline.mock";
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
    await user.delete();
    await admin.delete();

    user = null;
    admin = null;

    await closeApp();
  });

  it("should defined", () => {
    expect(app).toBeDefined();
  });

  let machine_id;
  it("create laundry machine", async () => {
    return request(app.getHttpServer())
      .post("/manage/laundry/machine")
      .auth(admin.jwt, { type: "bearer" })
      .send(LaundryMachineMock())
      .expect(201)
      .then((res) => {
        machine_id = res.body.data.id;
        expect(res.body.data.name).toBe("학봉관 1층 우측");
      });
  });

  it("get laundry machines", async () => {
    return request(app.getHttpServer())
      .get("/manage/laundry/machine/list")
      .auth(admin.jwt, { type: "bearer" })
      .expect(200)
      .then((res) => {
        const body = res.body.data.find((e) => e.id === machine_id);
        expect(body.name).toBe("학봉관 1층 우측");
      });
  });

  it("update laundry machine", async () => {
    return request(app.getHttpServer())
      .patch("/manage/laundry/machine")
      .auth(admin.jwt, { type: "bearer" })
      .send({ id: machine_id, ...LaundryMachineMock() })
      .expect(200)
      .then((res) => {
        expect(res.body.data.name).toBe("학봉관 1층 우측");
      });
  });

  let laundryTimeline_id;
  it("create laundry timeline", async () => {
    return request(app.getHttpServer())
      .post("/manage/laundry/timeline")
      .auth(admin.jwt, { type: "bearer" })
      .send(LaundryTimelineMock([machine_id]))
      .expect(201)
      .then((res) => {
        laundryTimeline_id = res.body.data.id;
        expect(res.body.data.name).toBe("평상시");
      });
  });

  it("get laundry timeline list", async () => {
    return request(app.getHttpServer())
      .get("/manage/laundry/timeline/list")
      .auth(admin.jwt, { type: "bearer" })
      .expect(200)
      .then((res) => {
        const body = res.body.data.find((e) => e.id === laundryTimeline_id);
        expect(body.name).toBe("평상시");
      });
  });

  it("get laundry time list", async () => {
    return request(app.getHttpServer())
      .get(`/manage/laundry/timeline?id=${laundryTimeline_id}`)
      .auth(admin.jwt, { type: "bearer" })
      .expect(200)
      .then((res) => {
        const body = res.body.data;
        expect(body.name).toBe("평상시");
      });
  });

  let time_id;
  it("update laundry timeline", async () => {
    return request(app.getHttpServer())
      .patch("/manage/laundry/timeline")
      .auth(admin.jwt, { type: "bearer" })
      .send({ id: laundryTimeline_id, ...LaundryTimelineMock([machine_id]) })
      .expect(200)
      .then((res) => {
        time_id = res.body.data.times[0].id;
        expect(res.body.data.name).toBe("평상시");
      });
  });

  let apply_id;
  it("create laundry apply", async () => {
    return request(app.getHttpServer())
      .post("/manage/laundry/apply")
      .auth(admin.jwt, { type: "bearer" })
      .send(LaundryApplyMock(machine_id, time_id, user.user.id))
      .expect(201)
      .then((res) => {
        apply_id = res.body.data.id;
        expect(res.body.data.date).toBe(moment().format("YYYY-MM-DD"));
      });
  });

  it("update laundry apply", async () => {
    return request(app.getHttpServer())
      .patch("/manage/laundry/apply")
      .auth(admin.jwt, { type: "bearer" })
      .send({ id: apply_id, user: user.user.id })
      .expect(200)
      .then((res) => {
        expect(res.body.data.date).toBe(moment().format("YYYY-MM-DD"));
      });
  });

  it("delete laundry apply", async () => {
    return request(app.getHttpServer())
      .delete("/manage/laundry/apply?id=" + apply_id)
      .auth(admin.jwt, { type: "bearer" })
      .expect(200)
      .then((res) => {
        expect(res.body.data.date).toBe(moment().format("YYYY-MM-DD"));
      });
  });

  it("delete timeline", async () => {
    return request(app.getHttpServer())
      .delete("/manage/laundry/timeline?id=" + laundryTimeline_id)
      .auth(admin.jwt, { type: "bearer" })
      .expect(200)
      .then((res) => {
        expect(res.body.data.name).toBe("평상시");
      });
  });

  it("delete machine", async () => {
    return request(app.getHttpServer())
      .delete("/manage/laundry/machine?id=" + machine_id)
      .auth(admin.jwt, { type: "bearer" })
      .expect(200)
      .then((res) => {
        expect(res.body.data.name).toBe("학봉관 1층 우측");
      });
  });
});
