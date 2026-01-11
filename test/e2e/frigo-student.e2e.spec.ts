import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { HttpStatus } from "@nestjs/common";
import { E2EContext, setupE2EContext } from "#test/helpers";

describe("Frigo Student E2E", () => {
  let ctx: E2EContext;

  beforeAll(async () => {
    ctx = await setupE2EContext();
  });

  afterAll(async () => {
    await ctx.testApp.close();
  });

  describe("GET /student/frigo", () => {
    test("should return user frigo application", async () => {
      const response = await ctx.request.get("/student/frigo", ctx.tokens.student.accessToken);

      expect(response.statusCode).toBe(HttpStatus.OK);
      const body = ctx.request.parseBody<{ ok: boolean; data: Record<string, unknown> }>(response);
      expect(body.ok).toBe(true);
      expect(body.data).toEqual({});
    });

    test("should reject unauthenticated requests", async () => {
      const response = await ctx.request.get("/student/frigo");

      expect(response.statusCode).toBe(HttpStatus.UNAUTHORIZED);
      const body = ctx.request.parseBody<{ statusCode: number; message: unknown }>(response);
      expect(body.statusCode).toBe(HttpStatus.UNAUTHORIZED);
      expect(body.message).toBeDefined();
    });
  });

  describe("POST /student/frigo", () => {
    test("should manage frigo application", async () => {
      const apply = await ctx.request.post(
        "/student/frigo",
        { timing: "dinner", reason: "visit", grade: 1 },
        ctx.tokens.student.accessToken,
      );
      expect(apply.statusCode).toBe(HttpStatus.CREATED);

      const cancel = await ctx.request.delete("/student/frigo", ctx.tokens.student.accessToken);
      expect(cancel.statusCode).toBe(HttpStatus.OK);
    });
  });
});
