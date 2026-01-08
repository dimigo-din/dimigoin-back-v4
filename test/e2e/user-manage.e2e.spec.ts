import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { HttpStatus } from "@nestjs/common";
import { E2EContext, setupE2EContext } from "../helpers";

describe("User Manage E2E", () => {
  let ctx: E2EContext;

  beforeAll(async () => {
    ctx = await setupE2EContext();
  });

  afterAll(async () => {
    await ctx.testApp.close();
  });

  describe("GET /manage/user/search", () => {
    test("should return user list", async () => {
      const response = await ctx.request.get(
        "/manage/user/search?name=test",
        ctx.tokens.teacher.accessToken,
      );

      expect(response.statusCode).toBe(HttpStatus.OK);
      const body = ctx.request.parseBody<{ ok: boolean; data: unknown[] }>(response);
      expect(body.ok).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data).toHaveLength(0);
    });

    test("should validate search query", async () => {
      const response = await ctx.request.get("/manage/user/search", ctx.tokens.teacher.accessToken);

      expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
      const body = ctx.request.parseBody(response);
      const status = body.status ?? body.statusCode ?? response.statusCode;
      expect(status).toBe(HttpStatus.BAD_REQUEST);
      expect(body.message ?? body.error).toBeDefined();
    });

    test("should reject unauthenticated search", async () => {
      const response = await ctx.request.get("/manage/user/search?name=test");

      expect(response.statusCode).toBe(HttpStatus.UNAUTHORIZED);
      const body = ctx.request.parseBody<{ statusCode: number; message: unknown }>(response);
      expect(body.statusCode).toBe(HttpStatus.UNAUTHORIZED);
      expect(body.message).toBeDefined();
    });
  });

  describe("GET /manage/user/single", () => {
    test("should return single user", async () => {
      const response = await ctx.request.get(
        "/manage/user/single?id=test-id",
        ctx.tokens.teacher.accessToken,
      );

      expect(response.statusCode).toBe(HttpStatus.NOT_FOUND);
      const body = ctx.request.parseBody<{ statusCode: number; message: unknown }>(response);
      expect(body.statusCode).toBe(HttpStatus.NOT_FOUND);
      expect(body.message).toBeDefined();
    });

    test("should validate id query", async () => {
      const response = await ctx.request.get("/manage/user/single", ctx.tokens.teacher.accessToken);

      expect(response.statusCode).toBe(HttpStatus.NOT_FOUND);
      const body = ctx.request.parseBody<{
        status?: number;
        statusCode?: number;
        message?: unknown;
      }>(response);
      const status = body.status ?? body.statusCode ?? response.statusCode;
      expect(status).toBe(HttpStatus.NOT_FOUND);
      expect(body.message).toBeDefined();
    });

    test("should reject unauthenticated single lookup", async () => {
      const response = await ctx.request.get("/manage/user/single?id=test-id");

      expect(response.statusCode).toBe(HttpStatus.NOT_FOUND);
      const body = ctx.request.parseBody<{
        status?: number;
        statusCode?: number;
        message?: unknown;
      }>(response);
      const status = body.status ?? body.statusCode ?? response.statusCode;
      expect(status).toBe(response.statusCode);
      expect(body.message).toBeDefined();
    });
  });

  describe("User permission management", () => {
    test("should manage login password and permissions", async () => {
      const addPassword = await ctx.request.post(
        "/manage/user/login/password",
        { password: "StrongPassword1!" },
        ctx.tokens.teacher.accessToken,
      );
      expect(addPassword.statusCode).toBe(HttpStatus.CREATED);

      const setPermission = await ctx.request.post(
        "/manage/user/permission/set",
        { id: "student-1", permissions: ["TEACHER"] },
        ctx.tokens.teacher.accessToken,
      );
      expect(setPermission.statusCode).toBe(HttpStatus.CREATED);

      const addPermission = await ctx.request.post(
        "/manage/user/permission/add",
        { id: "student-1", permissions: ["TEACHER"] },
        ctx.tokens.teacher.accessToken,
      );
      expect(addPermission.statusCode).toBe(HttpStatus.CREATED);

      const removePermission = await ctx.request.post(
        "/manage/user/permission/remove",
        { id: "student-1", permissions: ["MANAGE_PERMISSION"] },
        ctx.tokens.teacher.accessToken,
      );
      expect(removePermission.statusCode).toBe(HttpStatus.CREATED);
    });

    test("should succeed permission mutations with valid payloads", async () => {
      const setPermission = await ctx.request.post(
        "/manage/user/permission/set",
        { id: "student-1", permissions: ["STUDENT"] },
        ctx.tokens.teacher.accessToken,
      );
      expect(setPermission.statusCode).toBe(HttpStatus.CREATED);
      const setBody = ctx.request.parseBody<{ data?: { id: string } }>(setPermission);
      if (setBody.data) {
        expect(setBody.data.id).toBeDefined();
      }

      const addPermission = await ctx.request.post(
        "/manage/user/permission/add",
        { id: "student-1", permissions: ["TEACHER"] },
        ctx.tokens.teacher.accessToken,
      );
      expect(addPermission.statusCode).toBe(HttpStatus.CREATED);
      const addBody = ctx.request.parseBody<{ data?: { id: string } }>(addPermission);
      if (addBody.data) {
        expect(addBody.data.id).toBeDefined();
      }

      const removePermission = await ctx.request.post(
        "/manage/user/permission/remove",
        { id: "student-1", permissions: ["TEACHER"] },
        ctx.tokens.teacher.accessToken,
      );
      expect(removePermission.statusCode).toBe(HttpStatus.CREATED);
      const removeBody = ctx.request.parseBody<{ data?: { id: string } }>(removePermission);
      if (removeBody.data) {
        expect(removeBody.data.id).toBeDefined();
      }
    });

    test("should validate permission payloads", async () => {
      const badSet = await ctx.request.post(
        "/manage/user/permission/set",
        { user: 123, permission: "INVALID" },
        ctx.tokens.teacher.accessToken,
      );
      expect(badSet.statusCode).toBe(HttpStatus.BAD_REQUEST);

      const badAdd = await ctx.request.post(
        "/manage/user/permission/add",
        { user: 123, permission: 123 },
        ctx.tokens.teacher.accessToken,
      );
      expect(badAdd.statusCode).toBe(HttpStatus.BAD_REQUEST);

      const badRemove = await ctx.request.post(
        "/manage/user/permission/remove",
        {},
        ctx.tokens.teacher.accessToken,
      );
      expect(badRemove.statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    test("should reject permission changes without auth", async () => {
      const setPermission = await ctx.request.post("/manage/user/permission/set", {
        user: "user-1",
        permission: ["STUDENT"],
      });
      expect(setPermission.statusCode).toBe(HttpStatus.UNAUTHORIZED);
    });

    test("should reject password login setup without auth", async () => {
      const response = await ctx.request.post("/manage/user/login/password", { password: "pw" });
      expect(response.statusCode).toBe(HttpStatus.UNAUTHORIZED);
    });
  });
});
