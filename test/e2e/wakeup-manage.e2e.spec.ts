import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { HttpStatus } from "@nestjs/common";
import { E2EContext, setupE2EContext } from "#test/helpers";

describe("Wakeup Manage E2E", () => {
  let ctx: E2EContext;

  beforeAll(async () => {
    ctx = await setupE2EContext();
  });

  afterAll(async () => {
    await ctx.testApp.close();
  });

  describe("GET /manage/wakeup", () => {
    test("should return wakeup song applications", async () => {
      const response = await ctx.request.get("/manage/wakeup", ctx.tokens.teacher.accessToken);

      expect(response.statusCode).toBe(HttpStatus.OK);
      const body = ctx.request.parseBody<{ ok: boolean; data: unknown[] }>(response);
      expect(body.ok).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data).toHaveLength(0);
    });

    test("should reject unauthenticated manage request", async () => {
      const response = await ctx.request.get("/manage/wakeup");

      expect(response.statusCode).toBe(HttpStatus.UNAUTHORIZED);
      const body = ctx.request.parseBody<{ statusCode: number; message: unknown }>(response);
      expect(body.statusCode).toBe(HttpStatus.UNAUTHORIZED);
      expect(body.message).toBeDefined();
    });
  });

  describe("POST /manage/wakeup", () => {
    test("should create and delete wakeup entries", async () => {
      const created = await ctx.request.post(
        "/manage/wakeup",
        { id: "wakeup-1" },
        ctx.tokens.teacher.accessToken,
      );
      expect(created.statusCode).toBe(HttpStatus.CREATED);

      const deleted = await ctx.request.delete(
        "/manage/wakeup?id=wakeup-1",
        ctx.tokens.teacher.accessToken,
      );
      expect(deleted.statusCode).toBe(HttpStatus.OK);
    });
  });
});
