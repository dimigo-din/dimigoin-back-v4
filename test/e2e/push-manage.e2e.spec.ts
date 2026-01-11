import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { HttpStatus } from "@nestjs/common";
import { E2EContext, setupE2EContext } from "#test/helpers";

describe("Push Manage E2E", () => {
  let ctx: E2EContext;

  beforeAll(async () => {
    ctx = await setupE2EContext();
  });

  afterAll(async () => {
    await ctx.testApp.close();
  });

  describe("POST /manage/push/send", () => {
    test("should send push notification to all", async () => {
      const response = await ctx.request.post(
        "/manage/push/send",
        {
          category: "SchoolInformation",
          title: "Test Notification",
          body: "Test body",
          icon: "icon.png",
          badge: "badge.png",
          actions: [{ action: "open", title: "Open" }],
          data: {},
        },
        ctx.tokens.teacher.accessToken,
      );

      expect(response.statusCode).toBe(HttpStatus.CREATED);
      if (response.statusCode === HttpStatus.NO_CONTENT) {
        return;
      }
      const body = ctx.request.parseBody<{ ok: boolean; data: { sent: number; failed: number } }>(
        response,
      );
      expect(body.ok).toBe(true);
      expect(body.data).toEqual({ sent: 0, failed: 0 });
    });

    test("should validate notification payload", async () => {
      const response = await ctx.request.post(
        "/manage/push/send",
        {
          category: "",
          title: "",
          body: "",
          icon: "",
          badge: "",
          actions: [],
        },
        ctx.tokens.teacher.accessToken,
      );

      expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
      const body = ctx.request.parseBody(response);
      const status = body.status ?? body.statusCode ?? response.statusCode;
      expect(status).toBe(HttpStatus.BAD_REQUEST);
      expect(body.message ?? body.error).toBeDefined();
    });

    test("should reject unauthenticated notification send", async () => {
      const response = await ctx.request.post("/manage/push/send", {});

      expect(response.statusCode).toBe(HttpStatus.UNAUTHORIZED);
      const body = ctx.request.parseBody<{ statusCode: number; message: unknown }>(response);
      expect(body.statusCode).toBe(HttpStatus.UNAUTHORIZED);
      expect(body.message).toBeDefined();
    });
  });

  describe("GET /manage/push/userSubscriptions", () => {
    test("should return user subscriptions", async () => {
      const response = await ctx.request.get(
        "/manage/push/userSubscriptions?id=test-id",
        ctx.tokens.teacher.accessToken,
      );

      expect(response.statusCode).toBe(HttpStatus.OK);
      const body = ctx.request.parseBody<{ ok?: boolean; data?: unknown[]; statusCode?: number }>(
        response,
      );
      if (response.statusCode === HttpStatus.OK) {
        expect(body.ok).toBe(true);
        expect(Array.isArray(body.data)).toBe(true);
        expect(body.data).toHaveLength(0);
      } else {
        expect(body.statusCode).toBe(HttpStatus.NOT_FOUND);
      }
    });

    test("should reject unauthenticated subscription lookup", async () => {
      const response = await ctx.request.get("/manage/push/userSubscriptions?id=test-id");

      expect(response.statusCode).toBe(HttpStatus.UNAUTHORIZED);
      const body = ctx.request.parseBody<{ statusCode: number; message: unknown }>(response);
      expect(body.statusCode).toBe(HttpStatus.UNAUTHORIZED);
      expect(body.message).toBeDefined();
    });

    test("should validate query parameters", async () => {
      const response = await ctx.request.get(
        "/manage/push/userSubscriptions",
        ctx.tokens.teacher.accessToken,
      );

      expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
      const body = ctx.request.parseBody(response);
      const status = body.status ?? body.statusCode ?? response.statusCode;
      expect(status).toBe(HttpStatus.BAD_REQUEST);
      expect(body.message ?? body.error).toBeDefined();
    });
  });

  describe("POST /manage/push/send/user", () => {
    test("should send push to specific users", async () => {
      const response = await ctx.request.post(
        "/manage/push/send/user",
        {
          category: "SchoolInformation",
          title: "Hello",
          body: "World",
          icon: "icon.png",
          badge: "badge.png",
          actions: [{ action: "open", title: "Open" }],
          data: {},
          to: ["user-1"],
        },
        ctx.tokens.teacher.accessToken,
      );

      expect(response.statusCode).toBe(HttpStatus.CREATED);
    });
  });
});
