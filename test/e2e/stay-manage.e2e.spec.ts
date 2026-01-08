import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { HttpStatus } from "@nestjs/common";
import { E2EContext, setupE2EContext } from "../helpers";

describe("Stay Manage E2E", () => {
  let ctx: E2EContext;

  beforeAll(async () => {
    ctx = await setupE2EContext();
  });

  afterAll(async () => {
    await ctx.testApp.close();
  });

  describe("GET /manage/stay", () => {
    test("should return all stays", async () => {
      const response = await ctx.request.get("/manage/stay/list", ctx.tokens.teacher.accessToken);

      expect(response.statusCode).toBe(HttpStatus.OK);
      const body = ctx.request.parseBody<{ ok: boolean; data: unknown[] }>(response);
      expect(body.ok).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data).toHaveLength(0);
    });

    test("should reject unauthenticated access", async () => {
      const response = await ctx.request.get("/manage/stay/list");

      expect(response.statusCode).toBe(HttpStatus.UNAUTHORIZED);
      const body = ctx.request.parseBody<{ statusCode: number; message: unknown }>(response);
      expect(body.statusCode).toBe(HttpStatus.UNAUTHORIZED);
      expect(body.message).toBeDefined();
    });
  });

  describe("GET single stay resources", () => {
    test("should return seat preset detail", async () => {
      const response = await ctx.request.get(
        "/manage/stay/seat/preset?id=preset-1",
        ctx.tokens.teacher.accessToken,
      );
      expect(response.statusCode).toBe(HttpStatus.OK);
    });

    test("should return schedule detail", async () => {
      const response = await ctx.request.get(
        "/manage/stay/schedule?id=schedule-1",
        ctx.tokens.teacher.accessToken,
      );
      expect(response.statusCode).toBe(HttpStatus.OK);
    });

    test("should return stay detail", async () => {
      const response = await ctx.request.get(
        "/manage/stay?id=stay-1",
        ctx.tokens.teacher.accessToken,
      );
      expect(response.statusCode).toBe(HttpStatus.OK);
    });
  });

  describe("POST /manage/stay", () => {
    test("should create stay", async () => {
      const response = await ctx.request.post(
        "/manage/stay",
        {
          name: "Test Stay",
          from: new Date().toISOString(),
          to: new Date().toISOString(),
          period: [
            {
              grade: 1,
              start: new Date().toISOString(),
              end: new Date().toISOString(),
            },
          ],
          outing_day: ["0"],
          seat_preset: "preset-1",
        },
        ctx.tokens.teacher.accessToken,
      );

      expect(response.statusCode).toBe(HttpStatus.CREATED);
      const body = ctx.request.parseBody<{ ok: boolean; data: { id: string } }>(response);
      expect(body.ok).toBe(true);
      expect(body.data.id).toBe("stay-1");
    });

    test("should reject unauthenticated creation", async () => {
      const response = await ctx.request.post("/manage/stay", {
        name: "Test Stay",
      });

      expect(response.statusCode).toBe(HttpStatus.UNAUTHORIZED);
      const body = ctx.request.parseBody<{ statusCode: number; message: unknown }>(response);
      expect(body.statusCode).toBe(HttpStatus.UNAUTHORIZED);
      expect(body.message).toBeDefined();
    });

    test("should validate creation payload", async () => {
      const response = await ctx.request.post(
        "/manage/stay",
        {
          name: 123,
          from: "not-a-date",
          to: "still-not-a-date",
          period: [
            {
              grade: "first",
              start: "nope",
              end: "nope",
            },
          ],
          outing_day: [0],
          seat_preset: 999,
        },
        ctx.tokens.teacher.accessToken,
      );

      expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
      const body = ctx.request.parseBody(response);
      const status = body.status ?? body.statusCode ?? response.statusCode;
      expect(status).toBe(HttpStatus.BAD_REQUEST);
      const message = body.message ?? body.error ?? body;
      expect(message).toBeDefined();
    });
  });

  describe("Stay manage workflows", () => {
    test("should manage presets, schedules, stays, applies and outings", async () => {
      const outingPayload = {
        reason: "test outing",
        breakfast_cancel: false,
        lunch_cancel: false,
        dinner_cancel: false,
        from: "2024-01-01T00:00:00.000Z",
        to: "2024-01-01T02:00:00.000Z",
      };

      const seatPresetPayload = {
        name: "Preset",
        only_readingRoom: false,
        mappings: [{ target: "1_male", ranges: ["A1:A1"] }],
      };
      expect(
        (await ctx.request.get("/manage/stay/seat/preset/list", ctx.tokens.teacher.accessToken))
          .statusCode,
      ).toBe(HttpStatus.OK);

      const presetCreateStatus = (
        await ctx.request.post(
          "/manage/stay/seat/preset",
          seatPresetPayload,
          ctx.tokens.teacher.accessToken,
        )
      ).statusCode;
      expect(presetCreateStatus).toBe(HttpStatus.CREATED);

      const presetUpdateStatus = (
        await ctx.request.patch(
          "/manage/stay/seat/preset",
          { ...seatPresetPayload, id: "preset-1" },
          ctx.tokens.teacher.accessToken,
        )
      ).statusCode;
      expect(presetUpdateStatus).toBe(HttpStatus.OK);

      const presetDeleteStatus = (
        await ctx.request.delete(
          "/manage/stay/seat/preset?id=preset-1",
          ctx.tokens.teacher.accessToken,
        )
      ).statusCode;
      expect(presetDeleteStatus).toBe(HttpStatus.OK);

      const schedulePayload = {
        name: "Weekly",
        stayApplyPeriod: [
          {
            grade: 1,
            apply_start_day: 0,
            apply_start_hour: 0,
            apply_end_day: 1,
            apply_end_hour: 12,
          },
        ],
        stay_from: 1,
        stay_to: 5,
        outing_day: [6],
        staySeatPreset: "preset-1",
      };

      const scheduleCreateStatus = (
        await ctx.request.post(
          "/manage/stay/schedule",
          schedulePayload,
          ctx.tokens.teacher.accessToken,
        )
      ).statusCode;
      expect(scheduleCreateStatus).toBe(HttpStatus.CREATED);

      const scheduleUpdateStatus = (
        await ctx.request.patch(
          "/manage/stay/schedule",
          { ...schedulePayload, id: "schedule-1" },
          ctx.tokens.teacher.accessToken,
        )
      ).statusCode;
      expect(scheduleUpdateStatus).toBe(HttpStatus.OK);

      const scheduleDeleteStatus = (
        await ctx.request.delete(
          "/manage/stay/schedule?id=schedule-1",
          ctx.tokens.teacher.accessToken,
        )
      ).statusCode;
      expect(scheduleDeleteStatus).toBe(HttpStatus.OK);

      const stayPayload = {
        name: "Special Stay",
        from: "2024-01-01T00:00:00.000Z",
        to: "2024-01-02T00:00:00.000Z",
        period: [{ grade: 1, start: "2024-01-01T00:00:00.000Z", end: "2024-01-02T00:00:00.000Z" }],
        outing_day: ["2024-01-01"],
        seat_preset: "preset-1",
      };

      const stayCreateStatus = (
        await ctx.request.post("/manage/stay", stayPayload, ctx.tokens.teacher.accessToken)
      ).statusCode;
      expect(stayCreateStatus).toBe(HttpStatus.CREATED);

      const stayUpdateStatus = (
        await ctx.request.patch(
          "/manage/stay",
          { ...stayPayload, id: "stay-1" },
          ctx.tokens.teacher.accessToken,
        )
      ).statusCode;
      expect(stayUpdateStatus).toBe(HttpStatus.OK);

      const stayDeleteStatus = (
        await ctx.request.delete("/manage/stay?id=stay-1", ctx.tokens.teacher.accessToken)
      ).statusCode;
      expect(stayDeleteStatus).toBe(HttpStatus.OK);

      const stayApplyListStatus = (
        await ctx.request.get(
          "/manage/stay/apply?id=stay-1&grade=1",
          ctx.tokens.teacher.accessToken,
        )
      ).statusCode;
      expect(stayApplyListStatus).toBe(HttpStatus.OK);

      const manageApplyPayload = {
        stay: "stay-1",
        user: "student-1",
        stay_seat: "seat-1",
        outing: [outingPayload],
      };

      const stayApplyCreateStatus = (
        await ctx.request.post(
          "/manage/stay/apply",
          manageApplyPayload,
          ctx.tokens.teacher.accessToken,
        )
      ).statusCode;
      expect(stayApplyCreateStatus).toBe(HttpStatus.CREATED);

      const stayApplyUpdateStatus = (
        await ctx.request.patch(
          "/manage/stay/apply",
          { ...manageApplyPayload, id: "stay-apply-1" },
          ctx.tokens.teacher.accessToken,
        )
      ).statusCode;
      expect(stayApplyUpdateStatus).toBe(HttpStatus.OK);

      const stayApplyDeleteStatus = (
        await ctx.request.delete(
          "/manage/stay/apply?id=stay-apply-1",
          ctx.tokens.teacher.accessToken,
        )
      ).statusCode;
      expect(stayApplyDeleteStatus).toBe(HttpStatus.OK);

      const outingAuditStatus = (
        await ctx.request.patch(
          "/manage/stay/outing/audit",
          { id: "outing-1", reason: "ok", approved: true },
          ctx.tokens.teacher.accessToken,
        )
      ).statusCode;
      expect(outingAuditStatus).toBe(HttpStatus.OK);

      const outingMealStatus = (
        await ctx.request.patch(
          "/manage/stay/outing/meal_cancel",
          { id: "outing-1", breakfast_cancel: true, lunch_cancel: false, dinner_cancel: false },
          ctx.tokens.teacher.accessToken,
        )
      ).statusCode;
      expect(outingMealStatus).toBe(HttpStatus.OK);

      const changeSeatStatus = (
        await ctx.request.post(
          "/manage/stay/change_seat",
          { targets: ["stay-apply-1"], to: "seat-2" },
          ctx.tokens.teacher.accessToken,
        )
      ).statusCode;
      expect(changeSeatStatus).toBe(HttpStatus.CREATED);
    });
  });

  describe("Stay manage validations", () => {
    test("should require authentication for change seat", async () => {
      const response = await ctx.request.post("/manage/stay/change_seat", {
        targets: ["stay-apply-1"],
        to: "seat-2",
      });

      expect(response.statusCode).toBe(HttpStatus.UNAUTHORIZED);
    });

    test("should validate change seat payload", async () => {
      const response = await ctx.request.post(
        "/manage/stay/change_seat",
        { targets: "not-array" },
        ctx.tokens.teacher.accessToken,
      );

      expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
      const body = ctx.request.parseBody(response);
      const status = body.status ?? body.statusCode ?? response.statusCode;
      expect(status).toBe(HttpStatus.BAD_REQUEST);
    });

    test("should reject unauthenticated outing audit", async () => {
      const response = await ctx.request.patch("/manage/stay/outing/audit", {
        id: "outing-1",
        reason: "ok",
        approved: true,
      });
      expect(response.statusCode).toBe(HttpStatus.UNAUTHORIZED);
    });

    test("should reject unauthenticated outing meal cancel", async () => {
      const response = await ctx.request.patch("/manage/stay/outing/meal_cancel", {
        id: "outing-1",
        breakfast_cancel: true,
        lunch_cancel: false,
        dinner_cancel: false,
      });
      expect(response.statusCode).toBe(HttpStatus.UNAUTHORIZED);
    });
  });
});
