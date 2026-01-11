import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { HttpStatus } from "@nestjs/common";
import { E2EContext, setupE2EContext } from "#test/helpers";

describe("Facility Student E2E", () => {
  let ctx: E2EContext;

  beforeAll(async () => {
    ctx = await setupE2EContext();
  });

  afterAll(async () => {
    await ctx.testApp.close();
  });

  describe("GET /student/facility/list", () => {
    test("should return report list", async () => {
      const response = await ctx.request.get(
        "/student/facility/list",
        ctx.tokens.student.accessToken,
      );

      expect(response.statusCode).toBe(HttpStatus.OK);
      const body = ctx.request.parseBody<{ ok: boolean; data: unknown[] }>(response);
      expect(body.ok).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data).toHaveLength(0);
    });

    test("should reject unauthenticated access", async () => {
      const response = await ctx.request.get("/student/facility/list");

      expect(response.statusCode).toBe(HttpStatus.UNAUTHORIZED);
      const body = ctx.request.parseBody<{ statusCode: number; message: unknown }>(response);
      expect(body.statusCode).toBe(HttpStatus.UNAUTHORIZED);
      expect(body.message).toBeDefined();
    });
  });

  describe("GET /student/facility", () => {
    test("should return single report or not found", async () => {
      const response = await ctx.request.get(
        "/student/facility?id=facility-1",
        ctx.tokens.student.accessToken,
      );
      expect(response.statusCode).toBe(HttpStatus.OK);
    });

    test("should reject unauthenticated report detail", async () => {
      const response = await ctx.request.get("/student/facility?id=facility-1");
      expect(response.statusCode).toBe(HttpStatus.UNAUTHORIZED);
    });
  });

  describe("Facility student report flow", () => {
    test("should manage report and comments", async () => {
      const img = await ctx.request.get(
        "/student/facility/img?id=img-1",
        ctx.tokens.student.accessToken,
      );
      expect(img.statusCode).toBe(HttpStatus.OK);

      const report = await ctx.request.post(
        "/student/facility",
        { report_type: "suggest", subject: "Title", body: "Body", file: [] },
        ctx.tokens.student.accessToken,
      );
      expect(report.statusCode).toBe(HttpStatus.CREATED);

      const comment = await ctx.request.post(
        "/student/facility/comment",
        { post: "facility-1", parent_comment: null, text: "Nice" },
        ctx.tokens.student.accessToken,
      );
      expect(comment.statusCode).toBe(HttpStatus.CREATED);
    });

    test("should reject unauthenticated report and comment", async () => {
      const report = await ctx.request.post("/student/facility", {
        report_type: "suggest",
        subject: "Title",
        body: "Body",
        file: [],
      });
      expect(report.statusCode).toBe(HttpStatus.UNAUTHORIZED);

      const comment = await ctx.request.post("/student/facility/comment", {
        post: "facility-1",
        parent_comment: null,
        text: "Nice",
      });
      expect(comment.statusCode).toBe(HttpStatus.UNAUTHORIZED);
    });
  });
});
