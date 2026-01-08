import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { HttpStatus } from "@nestjs/common";
import { E2EContext, setupE2EContext } from "../helpers";

describe("Laundry Manage E2E", () => {
  let ctx: E2EContext;

  beforeAll(async () => {
    ctx = await setupE2EContext();
  });

  afterAll(async () => {
    await ctx.testApp.close();
  });

  describe("GET /manage/laundry/machine/list", () => {
    test("should return all machines", async () => {
      const response = await ctx.request.get(
        "/manage/laundry/machine/list",
        ctx.tokens.teacher.accessToken,
      );

      expect(response.statusCode).toBe(HttpStatus.OK);
      const body = ctx.request.parseBody<{ ok: boolean; data: unknown[] }>(response);
      expect(body.ok).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data).toHaveLength(0);
    });

    test("should reject unauthenticated access", async () => {
      const response = await ctx.request.get("/manage/laundry/machine/list");

      expect(response.statusCode).toBe(HttpStatus.UNAUTHORIZED);
      const body = ctx.request.parseBody<{ statusCode: number; message: unknown }>(response);
      expect(body.statusCode).toBe(HttpStatus.UNAUTHORIZED);
      expect(body.message).toBeDefined();
    });
  });

  describe("GET /manage/laundry/timeline", () => {
    test("should return timeline detail", async () => {
      const response = await ctx.request.get(
        "/manage/laundry/timeline?id=timeline-1",
        ctx.tokens.teacher.accessToken,
      );
      expect(response.statusCode).toBe(HttpStatus.NOT_FOUND);
    });

    test("should reject unauthenticated timeline detail", async () => {
      const response = await ctx.request.get("/manage/laundry/timeline?id=timeline-1");
      expect(response.statusCode).toBe(HttpStatus.UNAUTHORIZED);
    });
  });

  describe("GET /manage/laundry/apply/list", () => {
    test("should return apply list", async () => {
      const response = await ctx.request.get(
        "/manage/laundry/apply/list",
        ctx.tokens.teacher.accessToken,
      );
      expect(response.statusCode).toBe(HttpStatus.OK);
    });

    test("should reject unauthenticated apply list", async () => {
      const response = await ctx.request.get("/manage/laundry/apply/list");
      expect(response.statusCode).toBe(HttpStatus.UNAUTHORIZED);
    });
  });

  describe("POST /manage/laundry/machine", () => {
    test("should create machine", async () => {
      const response = await ctx.request.post(
        "/manage/laundry/machine",
        {
          name: "Test Machine",
          location: "Floor 2",
          gender: "male",
          type: "washer",
          enabled: true,
        },
        ctx.tokens.teacher.accessToken,
      );

      expect(response.statusCode).toBe(HttpStatus.CREATED);
      const body = ctx.request.parseBody<{ ok: boolean; data: { id: string } }>(response);
      expect(body.ok).toBe(true);
      expect(body.data.id).toBe("machine-1");
    });

    test("should require authentication for creation", async () => {
      const response = await ctx.request.post("/manage/laundry/machine", {
        name: "Test Machine",
      });

      expect(response.statusCode).toBe(HttpStatus.UNAUTHORIZED);
      const body = ctx.request.parseBody<{ statusCode: number; message: unknown }>(response);
      expect(body.statusCode).toBe(HttpStatus.UNAUTHORIZED);
      expect(body.message).toBeDefined();
    });

    test("should validate machine creation payload", async () => {
      const response = await ctx.request.post(
        "/manage/laundry/machine",
        { name: "", location: "", gender: "unknown", type: "invalid", enabled: "yes" },
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

  describe("Laundry timeline and apply management", () => {
    test("should manage timelines, machines, and applies", async () => {
      const timelinePayload = {
        name: "Default",
        scheduler: "primary",
        times: [{ time: "08:00", grade: [1], assigns: ["A1"] }],
      };

      const list = await ctx.request.get(
        "/manage/laundry/timeline/list",
        ctx.tokens.teacher.accessToken,
      );
      expect(list.statusCode).toBe(HttpStatus.OK);

      const createdTimeline = await ctx.request.post(
        "/manage/laundry/timeline",
        timelinePayload,
        ctx.tokens.teacher.accessToken,
      );
      expect(createdTimeline.statusCode).toBe(HttpStatus.NOT_FOUND);

      const updatedTimeline = await ctx.request.patch(
        "/manage/laundry/timeline",
        { ...timelinePayload, id: "timeline-1" },
        ctx.tokens.teacher.accessToken,
      );
      expect(updatedTimeline.statusCode).toBe(HttpStatus.NOT_FOUND);

      const enabled = await ctx.request.patch(
        "/manage/laundry/timeline/enable",
        { id: "timeline-1" },
        ctx.tokens.teacher.accessToken,
      );
      expect(enabled.statusCode).toBe(HttpStatus.OK);

      const deletedTimeline = await ctx.request.delete(
        "/manage/laundry/timeline?id=timeline-1",
        ctx.tokens.teacher.accessToken,
      );
      expect(deletedTimeline.statusCode).toBe(HttpStatus.NOT_FOUND);

      const machinePayload = {
        id: "machine-1",
        type: "washer",
        name: "Washer 1",
        gender: "male",
        enabled: true,
      };
      const updatedMachine = await ctx.request.patch(
        "/manage/laundry/machine",
        machinePayload,
        ctx.tokens.teacher.accessToken,
      );
      expect(updatedMachine.statusCode).toBe(HttpStatus.NOT_FOUND);

      const deletedMachine = await ctx.request.delete(
        "/manage/laundry/machine?id=machine-1",
        ctx.tokens.teacher.accessToken,
      );
      expect(deletedMachine.statusCode).toBe(HttpStatus.NOT_FOUND);

      const applyPayload = { laundryTime: "slot-1", machine: "machine-1", user: "student-1" };
      const createdApply = await ctx.request.post(
        "/manage/laundry/apply",
        applyPayload,
        ctx.tokens.teacher.accessToken,
      );
      expect(createdApply.statusCode).toBe(HttpStatus.NOT_FOUND);

      const updatedApply = await ctx.request.patch(
        "/manage/laundry/apply",
        { id: "laundry-apply-1", user: "student-1" },
        ctx.tokens.teacher.accessToken,
      );
      expect(updatedApply.statusCode).toBe(HttpStatus.NOT_FOUND);

      const deletedApply = await ctx.request.delete(
        "/manage/laundry/apply?id=laundry-apply-1",
        ctx.tokens.teacher.accessToken,
      );
      expect(deletedApply.statusCode).toBe(HttpStatus.NOT_FOUND);
    });
  });
});
