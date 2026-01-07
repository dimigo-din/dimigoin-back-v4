import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { HttpStatus } from "@nestjs/common";
import { E2EContext, setupE2EContext } from "../helpers";

describe("Facility Manage E2E", () => {
  let ctx: E2EContext;

  beforeAll(async () => {
    ctx = await setupE2EContext();
  });

  afterAll(async () => {
    await ctx.testApp.close();
  });

  describe("GET /manage/facility/list", () => {
    test("should return report list", async () => {
      const response = await ctx.request.get(
        "/manage/facility/list",
        ctx.tokens.teacher.accessToken,
      );

      expect(response.statusCode).toBe(HttpStatus.OK);
      const body = ctx.request.parseBody<{ ok: boolean; data: unknown[] }>(response);
      expect(body.ok).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data).toHaveLength(0);
    });

    test("should reject unauthenticated access", async () => {
      const response = await ctx.request.get("/manage/facility/list");

      expect(response.statusCode).toBe(HttpStatus.UNAUTHORIZED);
      const body = ctx.request.parseBody<{ statusCode: number; message: unknown }>(response);
      expect(body.statusCode).toBe(HttpStatus.UNAUTHORIZED);
      expect(body.message).toBeDefined();
    });
  });

  describe("Facility manage operations", () => {
    test("should handle report lifecycle", async () => {
      const img = await ctx.request.get(
        "/manage/facility/img?id=img-1",
        ctx.tokens.teacher.accessToken,
      );
      expect(img.statusCode).toBe(HttpStatus.OK);

      const deleteImg = await ctx.request.delete(
        "/manage/facility/img?id=img-1",
        ctx.tokens.teacher.accessToken,
      );
      expect(deleteImg.statusCode).toBe(HttpStatus.OK);

      const list = await ctx.request.get("/manage/facility/list", ctx.tokens.teacher.accessToken);
      expect(list.statusCode).toBe(HttpStatus.OK);

      const report = await ctx.request.get(
        "/manage/facility?id=facility-1",
        ctx.tokens.teacher.accessToken,
      );
      expect(report.statusCode).toBe(HttpStatus.OK);

      const create = await ctx.request.post(
        "/manage/facility",
        { report_type: "suggest", subject: "Title", body: "Body", file: [] },
        ctx.tokens.teacher.accessToken,
      );
      expect(create.statusCode).toBe(HttpStatus.CREATED);

      const comment = await ctx.request.post(
        "/manage/facility/comment",
        { post: "facility-1", parent_comment: null, text: "Nice" },
        ctx.tokens.teacher.accessToken,
      );
      expect(comment.statusCode).toBe(HttpStatus.CREATED);

      const deleteComment = await ctx.request.delete(
        "/manage/facility/comment?id=comment-1",
        ctx.tokens.teacher.accessToken,
      );
      expect(deleteComment.statusCode).toBe(HttpStatus.OK);

      const changeType = await ctx.request.patch(
        "/manage/facility/type",
        { id: "facility-1", type: "suggest" },
        ctx.tokens.teacher.accessToken,
      );
      expect(changeType.statusCode).toBe(HttpStatus.OK);

      const changeStatus = await ctx.request.patch(
        "/manage/facility/status",
        { id: "facility-1", status: "Waiting" },
        ctx.tokens.teacher.accessToken,
      );
      expect(changeStatus.statusCode).toBe(HttpStatus.OK);

      const deleteReport = await ctx.request.delete(
        "/manage/facility?id=facility-1",
        ctx.tokens.teacher.accessToken,
      );
      expect(deleteReport.statusCode).toBe(HttpStatus.OK);
    });

    test("should enforce auth for manage actions", async () => {
      const comment = await ctx.request.post("/manage/facility/comment", {
        post: "facility-1",
        parent_comment: null,
        text: "no auth",
      });
      expect(comment.statusCode).toBe(HttpStatus.UNAUTHORIZED);

      const changeType = await ctx.request.patch("/manage/facility/type", {
        id: "facility-1",
        type: "suggest",
      });
      expect(changeType.statusCode).toBe(HttpStatus.UNAUTHORIZED);

      const changeStatus = await ctx.request.patch("/manage/facility/status", {
        id: "facility-1",
        status: "Waiting",
      });
      expect(changeStatus.statusCode).toBe(HttpStatus.UNAUTHORIZED);

      const deleteImg = await ctx.request.delete("/manage/facility/img?id=img-1");
      expect(deleteImg.statusCode).toBe(HttpStatus.UNAUTHORIZED);
    });
  });
});
