import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { HttpStatus } from "@nestjs/common";
import { E2EContext, setupE2EContext } from "#test/helpers";

describe("Wakeup E2E", () => {
  let ctx: E2EContext;

  beforeAll(async () => {
    ctx = await setupE2EContext();
  });

  afterAll(async () => {
    await ctx.testApp.close();
  });

  describe("GET /wakeup/history", () => {
    test("should return wakeup song history", async () => {
      const response = await ctx.request.get("/wakeup/history?date=2024-01-01&gender=male");

      expect(response.statusCode).toBe(HttpStatus.OK);
      const body = ctx.request.parseBody<{
        ok: boolean;
        data: {
          title: string;
          channel: string;
          url: string;
          id: string;
        };
      }>(response);
      expect(body.ok).toBe(true);
      expect(body.data).toEqual({
        title: "Test Song",
        channel: "Test Channel",
        url: "https://youtube.com/watch?v=test",
        id: "test",
      });
    });

    test("should reject request without required query params", async () => {
      const response = await ctx.request.get("/wakeup/history");

      expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
      const body = ctx.request.parseBody(response);
      const status = body.status ?? body.statusCode ?? response.statusCode;
      expect(status).toBe(HttpStatus.BAD_REQUEST);
      const message = body.message ?? body.error ?? body;
      expect(message).toBeDefined();
    });

    test("should validate query param formats", async () => {
      const response = await ctx.request.get("/wakeup/history?date=2024-13-99&gender=unknown");

      expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
      const body = ctx.request.parseBody(response);
      const status = body.status ?? body.statusCode ?? response.statusCode;
      expect(status).toBe(HttpStatus.BAD_REQUEST);
      const message = body.message ?? body.error ?? body;
      expect(message).toBeDefined();
    });
  });
});
