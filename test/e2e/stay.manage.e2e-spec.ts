import { INestApplication } from "@nestjs/common";
import * as request from "supertest";

import { closeApp, getApp } from "../app.e2e";
import { StayApplyMock_Manage } from "../mocks/stay-apply-manage.mock";
import { StayScheduleMock } from "../mocks/stay-schedule.mock";
import { StaySeatPresetMock } from "../mocks/stay-seat-preset.mock";
import { StayMock } from "../mocks/stay.mock";
import { AdminUserMock, StudentUserMock } from "../mocks/user.mock";
import { UserMock } from "../types";

describe("Stay Manage", () => {
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

  it("stay seat preset create", async () => {
    return request(app.getHttpServer())
      .post("/manage/stay/seat/preset")
      .auth(admin.jwt, { type: "bearer" })
      .send(StaySeatPresetMock())
      .expect(201)
      .then((res) => {
        expect(res.body.name).toBe("평상시");
      });
  });

  let presetId;
  it("stay seat preset list", async () => {
    return request(app.getHttpServer())
      .get("/manage/stay/seat/preset/list")
      .auth(admin.jwt, { type: "bearer" })
      .expect(200)
      .then((res) => {
        presetId = res.body[0].id;
        expect(res.body[0].name).toBe("평상시");
      });
  });

  it("stay seat preset get", async () => {
    return request(app.getHttpServer())
      .get("/manage/stay/seat/preset")
      .query({ id: presetId })
      .auth(admin.jwt, { type: "bearer" })
      .expect(200)
      .then((res) => {
        expect(res.body.name).toBe("평상시");
      });
  });

  it("stay schedule create", async () => {
    return request(app.getHttpServer())
      .post("/manage/stay/schedule")
      .send(StayScheduleMock(presetId))
      .auth(admin.jwt, { type: "bearer" })
      .expect(201)
      .then((res) => {
        expect(res.body.name).toBe("평상시");
      });
  });

  let schedule_id;
  it("stay schedule list", async () => {
    return request(app.getHttpServer())
      .get("/manage/stay/schedule/list")
      .auth(admin.jwt, { type: "bearer" })
      .expect(200)
      .then((res) => {
        schedule_id = res.body[0].id;
        expect(res.body[0].name).toBe("평상시");
      });
  });

  it("stay schedule detail", async () => {
    return request(app.getHttpServer())
      .get("/manage/stay/schedule")
      .query({ id: schedule_id })
      .auth(admin.jwt, { type: "bearer" })
      .expect(200)
      .then((res) => {
        expect(res.body.name).toBe("평상시");
      });
  });

  it("stay create", async () => {
    return request(app.getHttpServer())
      .post("/manage/stay")
      .send(StayMock(presetId))
      .auth(admin.jwt, { type: "bearer" })
      .expect(201)
      .then((res) => {
        expect(res.body.name).toBe("평상시");
      });
  });

  let stay_id;
  it("stay list", async () => {
    return request(app.getHttpServer())
      .get("/manage/stay/list")
      .auth(admin.jwt, { type: "bearer" })
      .expect(200)
      .then((res) => {
        stay_id = res.body[0].id;
        expect(res.body[0].name).toBe("평상시");
      });
  });

  it("stay update", async () => {
    return request(app.getHttpServer())
      .patch("/manage/stay")
      .send({ id: stay_id, ...StayMock(presetId) })
      .auth(admin.jwt, { type: "bearer" })
      .expect(200)
      .then((res) => {
        expect(res.body.name).toBe("평상시");
      });
  });

  it("stay detail", async () => {
    return request(app.getHttpServer())
      .get("/manage/stay")
      .query({ id: stay_id })
      .auth(admin.jwt, { type: "bearer" })
      .expect(200)
      .then((res) => {
        expect(res.body.name).toBe("평상시");
      });
  });

  it("stay apply create", async () => {
    return request(app.getHttpServer())
      .post("/manage/stay/apply")
      .send(StayApplyMock_Manage(stay_id, user.user.id))
      .auth(admin.jwt, { type: "bearer" })
      .expect(201)
      .then((res) => {
        expect(res.body.stay_seat).toBe("A1");
        expect(res.body.outing[0].reason).toBe("자기계발외출");
      });
  });

  let stay_apply_id;
  it("stay apply list", async () => {
    return request(app.getHttpServer())
      .get("/manage/stay/apply/list")
      .auth(admin.jwt, { type: "bearer" })
      .expect(200)
      .then((res) => {
        stay_apply_id = res.body[0].id;
        expect(res.body[0].stay.name).toBe("평상시");
      });
  });

  let outing_id;
  it("stay apply update", async () => {
    return request(app.getHttpServer())
      .patch("/manage/stay/apply")
      .send({ id: stay_apply_id, ...StayApplyMock_Manage(stay_id, user.user.id) })
      .auth(admin.jwt, { type: "bearer" })
      .expect(200)
      .then((res) => {
        outing_id = res.body.outing[0].id;
        expect(res.body.stay_seat).toBe("A1");
        expect(res.body.outing[0].reason).toBe("자기계발외출");
      });
  });

  it("stay apply detail", async () => {
    return request(app.getHttpServer())
      .get("/manage/stay/apply")
      .query({ id: stay_apply_id })
      .auth(admin.jwt, { type: "bearer" })
      .expect(200)
      .then((res) => {
        expect(res.body.stay_seat).toBe("A1");
        expect(res.body.outing[0].reason).toBe("자기계발외출");
      });
  });

  it("audit outing", async () => {
    return request(app.getHttpServer())
      .patch("/manage/stay/outing/audit")
      .send({ id: outing_id, approved: true, reason: "" })
      .auth(admin.jwt, { type: "bearer" })
      .expect(200)
      .then((res) => {
        expect(res.body.approved).toBe(true);
        expect(res.body.audit_reason).toBe("");
      });
  });

  it("update meal cancel on outing", async () => {
    return request(app.getHttpServer())
      .patch("/manage/stay/outing/meal_cancel")
      .send({ id: outing_id, breakfast_cancel: true, lunch_cancel: true, dinner_cancel: true })
      .auth(admin.jwt, { type: "bearer" })
      .expect(200)
      .then((res) => {
        expect(res.body.breakfast_cancel).toBe(true);
        expect(res.body.lunch_cancel).toBe(true);
        expect(res.body.dinner_cancel).toBe(true);
      });
  });

  it("delete all", async () => {
    await request(app.getHttpServer())
      .delete("/manage/stay")
      .query({ id: stay_id })
      .auth(admin.jwt, { type: "bearer" })
      .expect(200);
    await request(app.getHttpServer())
      .delete("/manage/stay/schedule")
      .query({ id: schedule_id })
      .auth(admin.jwt, { type: "bearer" })
      .expect(200);
    await request(app.getHttpServer())
      .delete("/manage/stay/seat/preset")
      .query({ id: presetId })
      .auth(admin.jwt, { type: "bearer" })
      .expect(200);
  });
});
