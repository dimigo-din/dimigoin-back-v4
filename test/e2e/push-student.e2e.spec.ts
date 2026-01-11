import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { HttpStatus } from "@nestjs/common";
import { E2EContext, setupE2EContext } from "../helpers";

describe("Push Student E2E", () => {
  let ctx: E2EContext;

  beforeAll(async () => {
    ctx = await setupE2EContext();
  });

  afterAll(async () => {
    await ctx.testApp.close();
  });

  describe("GET /student/push/subjects", () => {
    test("should return push subjects", async () => {
      const response = await ctx.request.get(
        "/student/push/subjects",
        ctx.tokens.student.accessToken,
      );

      expect(response.statusCode).toBe(HttpStatus.OK);
      const body = ctx.request.parseBody<{
        ok: boolean;
        data: { identifier: string; name: string }[];
      }>(response);
      expect(body.ok).toBe(true);
      expect(body.data).toEqual([{ identifier: "notice", name: "Notice" }]);
    });

    test("should reject unauthenticated subject request", async () => {
      const response = await ctx.request.get("/student/push/subjects");

      expect(response.statusCode).toBe(HttpStatus.UNAUTHORIZED);
      const body = ctx.request.parseBody<{ statusCode: number; message: unknown }>(response);
      expect(body.statusCode).toBe(HttpStatus.UNAUTHORIZED);
      expect(body.message).toBeDefined();
    });
  });

  describe("PUT /student/push/subscribe", () => {
    test("should create FCM subscription", async () => {
      const response = await ctx.request.put(
        "/student/push/subscribe",
        {
          deviceId: "test-device",
          token: "test-fcm-token",
        },
        ctx.tokens.student.accessToken,
      );

      expect(response.statusCode).toBe(HttpStatus.OK);
      const body = ctx.request.parseBody<{ ok: boolean; data: { token: string } }>(response);
      expect(body.ok).toBe(true);
      expect(body.data.token).toBe("test-fcm-token");
    });

    test("should validate subscription payload", async () => {
      const response = await ctx.request.put(
        "/student/push/subscribe",
        // invalid types to trigger validation failure
        { deviceId: 123, token: 456 },
        ctx.tokens.student.accessToken,
      );

      expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
      const body = ctx.request.parseBody(response);
      const status = body.status ?? body.statusCode ?? response.statusCode;
      expect(status).toBe(HttpStatus.BAD_REQUEST);
      const message = body.message ?? body.error ?? body;
      expect(message).toBeDefined();
    });

    test("should reject unauthenticated subscription", async () => {
      const response = await ctx.request.put("/student/push/subscribe", {
        deviceId: "test-device",
        token: "test-fcm-token",
      });

      expect(response.statusCode).toBe(HttpStatus.UNAUTHORIZED);
      const body = ctx.request.parseBody<{ statusCode: number; message: unknown }>(response);
      expect(body.statusCode).toBe(HttpStatus.UNAUTHORIZED);
      expect(body.message).toBeDefined();
    });
  });

  describe("Push subscription management", () => {
    test("should manage subscriptions and subjects", async () => {
      const removeToken = await ctx.app.inject({
        method: "DELETE",
        url: "/student/push/subscribe",
        payload: { token: "test-fcm-token" },
        headers: { authorization: `Bearer ${ctx.tokens.student.accessToken}` },
      });
      expect(removeToken.statusCode).toBe(HttpStatus.OK);

      const unsubAll = await ctx.request.delete(
        "/student/push/unsubscribe/all",
        ctx.tokens.student.accessToken,
      );
      expect(unsubAll.statusCode).toBe(HttpStatus.OK);

      const subscribed = await ctx.request.get(
        "/student/push/subjects/subscribed?deviceId=test-device",
        ctx.tokens.student.accessToken,
      );
      expect(subscribed.statusCode).toBe(HttpStatus.OK);

      const setSubjects = await ctx.request.patch(
        "/student/push/subjects/subscribed",
        { deviceId: "test-device", subjects: ["SchoolInformation"] },
        ctx.tokens.student.accessToken,
      );
      expect(setSubjects.statusCode).toBe(HttpStatus.OK);
    });
  });
});
