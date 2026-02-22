import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { HttpStatus } from "@nestjs/common";
import { E2EContext, setupE2EContext } from "#test/helpers";

describe("Laundry Student E2E", () => {
  let ctx: E2EContext;
  const validPayload = { time: "09:00", machine: "machine-1" };

  beforeAll(async () => {
    ctx = await setupE2EContext();
  });

  afterAll(async () => {
    await ctx.testApp.close();
  });

  describe("GET /student/laundry/timeline", () => {
    test("should return available timelines", async () => {
      const response = await ctx.request.get(
        "/student/laundry/timeline",
        ctx.tokens.student.accessToken,
      );

      expect(response.statusCode).toBe(HttpStatus.OK);
      const body = ctx.request.parseBody<{ ok: boolean; data: unknown[] }>(response);
      expect(body.ok).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data).toHaveLength(0);
    });

    test("should reject unauthenticated request", async () => {
      const response = await ctx.request.get("/student/laundry/timeline");

      const body = ctx.request.parseBody(response);
      const status = body.status ?? body.statusCode ?? response.statusCode;
      expect(status).toBe(HttpStatus.UNAUTHORIZED);
      const message = body.message ?? body.error ?? body;
      expect(message).toBeDefined();
    });
  });

  describe("Laundry apply management", () => {
    test("should list laundry applications", async () => {
      const applies = await ctx.request.get("/student/laundry", ctx.tokens.student.accessToken);

      expect(applies.statusCode).toBe(HttpStatus.OK);
      const body = ctx.request.parseBody<{ ok: boolean; data: unknown[] }>(applies);
      expect(body.ok).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data).toHaveLength(0);
    });

    test("should reject unauthenticated apply list", async () => {
      const response = await ctx.request.get("/student/laundry");

      const body = ctx.request.parseBody(response);
      const status = body.status ?? body.statusCode ?? response.statusCode;
      expect(status).toBe(HttpStatus.UNAUTHORIZED);
      const message = body.message ?? body.error ?? body;
      expect(message).toBeDefined();
    });

    test("should create laundry apply", async () => {
      const response = await ctx.request.post(
        "/student/laundry",
        validPayload,
        ctx.tokens.student.accessToken,
      );

      expect(response.statusCode).toBe(HttpStatus.CREATED);
      const body = ctx.request.parseBody<{ ok: boolean; data: { id: string } }>(response);
      expect(body.ok).toBe(true);
      expect(body.data.id).toBe("laundry-apply-1");
    });

    test("should validate apply payload", async () => {
      const response = await ctx.request.post(
        "/student/laundry",
        {},
        ctx.tokens.student.accessToken,
      );

      const body = ctx.request.parseBody(response);
      const status = body.status ?? body.statusCode ?? response.statusCode;
      expect(status).toBe(HttpStatus.BAD_REQUEST);
      const message = body.message ?? body.error ?? body;
      expect(message).toBeDefined();
    });

    test("should require auth for apply creation", async () => {
      const response = await ctx.request.post("/student/laundry", validPayload);

      const body = ctx.request.parseBody(response);
      const status = body.status ?? body.statusCode ?? response.statusCode;
      expect(status).toBe(HttpStatus.UNAUTHORIZED);
      const message = body.message ?? body.error ?? body;
      expect(message).toBeDefined();
    });

    test("should delete laundry apply", async () => {
      const response = await ctx.request.delete(
        "/student/laundry?id=laundry-apply-1",
        ctx.tokens.student.accessToken,
      );

      expect(response.statusCode).toBe(HttpStatus.OK);
      const body = ctx.request.parseBody<{ ok: boolean; data: { id: string } }>(response);
      expect(body.ok).toBe(true);
      expect(body.data.id).toBe("laundry-apply-1");
    });

    test("should validate delete payload", async () => {
      const response = await ctx.request.delete("/student/laundry", ctx.tokens.student.accessToken);

      const body = ctx.request.parseBody(response);
      const status = body.status ?? body.statusCode ?? response.statusCode;
      expect(status).toBe(HttpStatus.BAD_REQUEST);
      const message = body.message ?? body.error ?? body;
      expect(message).toBeDefined();
    });
  });
});
