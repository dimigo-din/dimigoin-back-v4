import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { HttpStatus } from "@nestjs/common";
import { E2EContext, setupE2EContext } from "../helpers";

describe("Wakeup Student E2E", () => {
  let ctx: E2EContext;

  beforeAll(async () => {
    ctx = await setupE2EContext();
  });

  afterAll(async () => {
    await ctx.testApp.close();
  });

  describe("GET /student/wakeup/search", () => {
    test("should search youtube videos", async () => {
      const response = await ctx.request.get(
        "/student/wakeup/search?query=test",
        ctx.tokens.student.accessToken,
      );

      expect(response.statusCode).toBe(HttpStatus.OK);
      const body = ctx.request.parseBody<{ ok: boolean; data: { items: unknown[] } }>(response);
      expect(body.ok).toBe(true);
      expect(body.data.items).toEqual([]);
    });

    test("should validate query string", async () => {
      const response = await ctx.request.get(
        "/student/wakeup/search",
        ctx.tokens.student.accessToken,
      );

      expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
      const body = ctx.request.parseBody(response);
      const status = body.status ?? body.statusCode ?? response.statusCode;
      expect(status).toBe(HttpStatus.BAD_REQUEST);
      expect(body.message ?? body.error).toBeDefined();
    });

    test("should reject unauthenticated search", async () => {
      const response = await ctx.request.get("/student/wakeup/search?query=test");

      expect(response.statusCode).toBe(HttpStatus.UNAUTHORIZED);
      const body = ctx.request.parseBody<{ statusCode: number; message: unknown }>(response);
      expect(body.statusCode).toBe(HttpStatus.UNAUTHORIZED);
      expect(body.message).toBeDefined();
    });
  });

  describe("GET /student/wakeup", () => {
    test("should return wakeup song applications", async () => {
      const response = await ctx.request.get("/student/wakeup", ctx.tokens.student.accessToken);

      expect(response.statusCode).toBe(HttpStatus.OK);
      const body = ctx.request.parseBody<{ ok: boolean; data: unknown[] }>(response);
      expect(body.ok).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data).toHaveLength(0);
    });

    test("should reject unauthenticated applications request", async () => {
      const response = await ctx.request.get("/student/wakeup");

      expect(response.statusCode).toBe(HttpStatus.UNAUTHORIZED);
      const body = ctx.request.parseBody<{ statusCode: number; message: unknown }>(response);
      expect(body.statusCode).toBe(HttpStatus.UNAUTHORIZED);
      expect(body.message).toBeDefined();
    });
  });

  describe("GET /student/wakeup/vote", () => {
    test("should return user votes", async () => {
      const response = await ctx.request.get(
        "/student/wakeup/vote",
        ctx.tokens.student.accessToken,
      );

      expect(response.statusCode).toBe(HttpStatus.OK);
      const body = ctx.request.parseBody<{ ok: boolean; data: unknown[] }>(response);
      expect(body.ok).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data).toHaveLength(0);
    });

    test("should reject unauthenticated vote request", async () => {
      const response = await ctx.request.get("/student/wakeup/vote");

      expect(response.statusCode).toBe(HttpStatus.UNAUTHORIZED);
      const body = ctx.request.parseBody<{ statusCode: number; message: unknown }>(response);
      expect(body.statusCode).toBe(HttpStatus.UNAUTHORIZED);
      expect(body.message).toBeDefined();
    });
  });

  describe("POST /student/wakeup", () => {
    test("should manage applications and votes", async () => {
      const created = await ctx.request.post(
        "/student/wakeup",
        { videoId: "video-1" },
        ctx.tokens.student.accessToken,
      );
      expect(created.statusCode).toBe(HttpStatus.CREATED);

      const vote = await ctx.request.post(
        "/student/wakeup/vote",
        { songId: "wakeup-apply-1", upvote: true },
        ctx.tokens.student.accessToken,
      );
      expect(vote.statusCode).toBe(HttpStatus.CREATED);

      const unvote = await ctx.request.delete(
        "/student/wakeup/vote?id=vote-1",
        ctx.tokens.student.accessToken,
      );
      expect(unvote.statusCode).toBe(HttpStatus.OK);
    });
  });
});
