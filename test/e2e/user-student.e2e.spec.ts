import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { HttpStatus } from "@nestjs/common";
import { E2EContext, setupE2EContext } from "#test/helpers";

describe("User Student E2E", () => {
  let ctx: E2EContext;

  beforeAll(async () => {
    ctx = await setupE2EContext();
  });

  afterAll(async () => {
    await ctx.testApp.close();
  });

  describe("GET /student/user/timeline", () => {
    test("should return timeline", async () => {
      const response = await ctx.request.get(
        "/student/user/timeline",
        ctx.tokens.student.accessToken,
      );

      expect(response.statusCode).toBe(HttpStatus.OK);
      const body = ctx.request.parseBody<{ ok: boolean; data: unknown[] }>(response);
      expect(body.ok).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data).toHaveLength(0);
    });

    test("should ignore deprecated grade/class query params", async () => {
      const response = await ctx.request.get(
        "/student/user/timeline?grade=5&class=a",
        ctx.tokens.student.accessToken,
      );

      expect(response.statusCode).toBe(HttpStatus.OK);
    });

    test("should reject unauthenticated requests", async () => {
      const response = await ctx.request.get("/student/user/timeline");

      expect(response.statusCode).toBe(HttpStatus.UNAUTHORIZED);
      const body = ctx.request.parseBody<{ statusCode: number; message: unknown }>(response);
      expect(body.statusCode).toBe(HttpStatus.UNAUTHORIZED);
      expect(body.message).toBeDefined();
    });
  });

  describe("GET /student/user/apply", () => {
    test("should return apply list", async () => {
      const response = await ctx.request.get("/student/user/apply", ctx.tokens.student.accessToken);

      expect(response.statusCode).toBe(HttpStatus.OK);
    });
  });
});
