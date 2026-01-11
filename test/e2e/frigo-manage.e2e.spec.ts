import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { HttpStatus } from "@nestjs/common";
import { E2EContext, setupE2EContext } from "#test/helpers";

describe("Frigo Manage E2E", () => {
  let ctx: E2EContext;

  beforeAll(async () => {
    ctx = await setupE2EContext();
  });

  afterAll(async () => {
    await ctx.testApp.close();
  });

  describe("GET /manage/frigo/period", () => {
    test("should return apply periods", async () => {
      const response = await ctx.request.get(
        "/manage/frigo/period",
        ctx.tokens.teacher.accessToken,
      );

      expect(response.statusCode).toBe(HttpStatus.OK);
      const body = ctx.request.parseBody<{ ok: boolean; data: unknown[] }>(response);
      expect(body.ok).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data).toHaveLength(0);
    });

    test("should reject unauthenticated period request", async () => {
      const response = await ctx.request.get("/manage/frigo/period");

      expect(response.statusCode).toBe(HttpStatus.UNAUTHORIZED);
      const body = ctx.request.parseBody<{ statusCode: number; message: unknown }>(response);
      expect(body.statusCode).toBe(HttpStatus.UNAUTHORIZED);
      expect(body.message).toBeDefined();
    });
  });

  describe("GET /manage/frigo", () => {
    test("should return apply list", async () => {
      const response = await ctx.request.get("/manage/frigo", ctx.tokens.teacher.accessToken);

      expect(response.statusCode).toBe(HttpStatus.OK);
      const body = ctx.request.parseBody<{ ok: boolean; data: unknown[] }>(response);
      expect(body.ok).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data).toHaveLength(0);
    });

    test("should reject unauthenticated apply list request", async () => {
      const response = await ctx.request.get("/manage/frigo");

      expect(response.statusCode).toBe(HttpStatus.UNAUTHORIZED);
      const body = ctx.request.parseBody<{ statusCode: number; message: unknown }>(response);
      expect(body.statusCode).toBe(HttpStatus.UNAUTHORIZED);
      expect(body.message).toBeDefined();
    });
  });

  describe("Frigo period and apply management", () => {
    test("should manage periods and applications", async () => {
      const periodPayload = {
        apply_start_day: 0,
        apply_end_day: 1,
        apply_start_hour: 0,
        apply_end_hour: 12,
        grade: 1,
      };
      const setPeriod = await ctx.request.post(
        "/manage/frigo/period",
        periodPayload,
        ctx.tokens.teacher.accessToken,
      );
      expect(setPeriod.statusCode).toBe(HttpStatus.CREATED);

      const removePeriod = await ctx.request.delete(
        "/manage/frigo/period?id=period-1",
        ctx.tokens.teacher.accessToken,
      );
      expect(removePeriod.statusCode).toBe(HttpStatus.OK);

      const applyPayload = { timing: "dinner", reason: "go home", user: "student-1" };
      const apply = await ctx.request.post(
        "/manage/frigo",
        applyPayload,
        ctx.tokens.teacher.accessToken,
      );
      expect(apply.statusCode).toBe(HttpStatus.CREATED);

      const audit = await ctx.request.patch(
        "/manage/frigo",
        { id: "frigo-apply-1", approved: true },
        ctx.tokens.teacher.accessToken,
      );
      expect(audit.statusCode).toBe(HttpStatus.OK);

      const removeApply = await ctx.request.delete(
        "/manage/frigo?id=frigo-apply-1",
        ctx.tokens.teacher.accessToken,
      );
      expect(removeApply.statusCode).toBe(HttpStatus.OK);
    });
  });
});
