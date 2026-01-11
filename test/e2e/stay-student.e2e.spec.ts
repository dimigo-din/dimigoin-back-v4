import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { HttpStatus } from "@nestjs/common";
import { E2EContext, setupE2EContext } from "#test/helpers";

const outingPayload = {
  reason: "test outing",
  breakfast_cancel: false,
  lunch_cancel: false,
  dinner_cancel: false,
  from: "2024-01-01T00:00:00.000Z",
  to: "2024-01-01T02:00:00.000Z",
};

const stayApplyPayload = {
  stay: "stay-1",
  stay_seat: "seat-1",
  grade: 1,
  gender: "male",
  outing: [outingPayload],
};

describe("Stay Student E2E", () => {
  let ctx: E2EContext;

  beforeAll(async () => {
    ctx = await setupE2EContext();
  });

  afterAll(async () => {
    await ctx.testApp.close();
  });

  describe("GET /student/stay", () => {
    test("should return stay list", async () => {
      const response = await ctx.request.get(
        "/student/stay?grade=1",
        ctx.tokens.student.accessToken,
      );

      expect(response.statusCode).toBe(HttpStatus.OK);
      const body = ctx.request.parseBody<{ ok: boolean; data: unknown[] }>(response);
      expect(body.ok).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data).toHaveLength(0);
    });

    test("should require authentication", async () => {
      const response = await ctx.request.get("/student/stay?grade=1");

      expect(response.statusCode).toBe(HttpStatus.UNAUTHORIZED);
      const body = ctx.request.parseBody<{ statusCode: number; message: unknown }>(response);
      expect(body.statusCode).toBe(HttpStatus.UNAUTHORIZED);
      expect(body.message).toBeDefined();
    });

    test("should validate grade query", async () => {
      const response = await ctx.request.get(
        "/student/stay?grade=0",
        ctx.tokens.student.accessToken,
      );

      expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
      const body = ctx.request.parseBody(response);
      const status = body.status ?? body.statusCode ?? response.statusCode;
      expect(status).toBe(HttpStatus.BAD_REQUEST);
      const message = body.message ?? body.error ?? body;
      expect(message).toBeDefined();
    });
  });

  describe("Stay apply management", () => {
    test("should manage stay applications and outings", async () => {
      const applies = await ctx.request.get("/student/stay/apply", ctx.tokens.student.accessToken);
      expect(applies.statusCode).toBe(HttpStatus.OK);

      const createdApply = await ctx.request.post(
        "/student/stay/apply",
        stayApplyPayload,
        ctx.tokens.student.accessToken,
      );
      expect(createdApply.statusCode).toBe(HttpStatus.CREATED);

      const updatedApply = await ctx.request.patch(
        "/student/stay/apply",
        stayApplyPayload,
        ctx.tokens.student.accessToken,
      );
      expect(updatedApply.statusCode).toBe(HttpStatus.OK);

      const deletedApply = await ctx.request.delete(
        "/student/stay/apply?id=stay-1&grade=1",
        ctx.tokens.student.accessToken,
      );
      expect(deletedApply.statusCode).toBe(HttpStatus.OK);

      const outingList = await ctx.request.get(
        "/student/stay/outing?id=stay-1&grade=1",
        ctx.tokens.student.accessToken,
      );
      expect(outingList.statusCode).toBe(HttpStatus.OK);

      const addOuting = await ctx.request.post(
        "/student/stay/outing",
        { apply_id: "stay-apply-1", outing: outingPayload, grade: 1 },
        ctx.tokens.student.accessToken,
      );
      expect(addOuting.statusCode).toBe(HttpStatus.CREATED);

      const editOuting = await ctx.request.patch(
        "/student/stay/outing",
        { outing_id: "outing-1", outing: outingPayload, grade: 1 },
        ctx.tokens.student.accessToken,
      );
      expect(editOuting.statusCode).toBe(HttpStatus.OK);

      const deleteOuting = await ctx.request.delete(
        "/student/stay/outing?id=outing-1&grade=1",
        ctx.tokens.student.accessToken,
      );
      expect(deleteOuting.statusCode).toBe(HttpStatus.OK);
    });
  });
});
