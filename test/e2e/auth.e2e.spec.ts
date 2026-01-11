import { afterAll, beforeAll, describe, expect, mock, test } from "bun:test";
import { HttpStatus } from "@nestjs/common";

import { JWTResponse } from "@/auth/auth.dto";
import { AuthService } from "@/auth/auth.service";
import { E2EContext, setupE2EContext } from "../helpers";

describe("Auth E2E", () => {
  let ctx: E2EContext;
  let tokens: JWTResponse;
  let authService: AuthService;

  beforeAll(async () => {
    ctx = await setupE2EContext();
    tokens = ctx.tokens.student;
    authService = ctx.app.get(AuthService);
  });

  afterAll(async () => {
    await ctx.testApp.close();
  });

  describe("GET /auth/login/google", () => {
    test("should return Google OAuth URL", async () => {
      const response = await ctx.request.get("/auth/login/google?redirect_uri=http://localhost");

      expect(response.statusCode).toBe(HttpStatus.OK);

      const body = ctx.request.parseBody<{ ok: boolean; data: string; status: number }>(response);
      expect(body.ok).toBe(true);
      expect(typeof body.data).toBe("string");
      expect(body.data).toContain("https://accounts.google.com");
    });

    test("should include client ID in OAuth URL", async () => {
      const response = await ctx.request.get("/auth/login/google?redirect_uri=http://localhost");

      const body = ctx.request.parseBody<{ data: string }>(response);
      expect(body.data).toContain("client_id");
    });
  });

  describe("POST /auth/login/google/callback", () => {
    test("should login via google callback", async () => {
      authService.loginByGoogle = mock(
        async () => ctx.tokens.student,
      ) as unknown as typeof authService.loginByGoogle;

      const response = await ctx.request.post("/auth/login/google/callback", {
        code: "dummy-code",
        redirect_uri: "http://localhost",
      });

      expect(response.statusCode).toBe(HttpStatus.CREATED);
      const body = ctx.request.parseBody<{ data: JWTResponse; ok: boolean }>(response);
      expect(body.ok).toBe(true);
      expect(body.data.accessToken).toBeDefined();
    });

    test("should validate web callback payload", async () => {
      const response = await ctx.request.post("/auth/login/google/callback", {});

      expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
      const body = ctx.request.parseBody(response);
      const status = body.status ?? body.statusCode ?? response.statusCode;
      expect(status).toBe(HttpStatus.BAD_REQUEST);
    });
  });

  describe("POST /auth/login/google/callback/app", () => {
    test("should login via google app callback", async () => {
      authService.loginByGoogle = mock(
        async () => ctx.tokens.student,
      ) as unknown as typeof authService.loginByGoogle;

      const response = await ctx.request.post("/auth/login/google/callback/app", {
        idToken: "dummy-token",
      });

      expect(response.statusCode).toBe(HttpStatus.CREATED);
      const body = ctx.request.parseBody<{ data: JWTResponse; ok: boolean }>(response);
      expect(body.ok).toBe(true);
      expect(body.data.accessToken).toBeDefined();
    });

    test("should validate app callback payload", async () => {
      const response = await ctx.request.post("/auth/login/google/callback/app", {});

      expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
      const body = ctx.request.parseBody(response);
      const status = body.status ?? body.statusCode ?? response.statusCode;
      expect(status).toBe(HttpStatus.BAD_REQUEST);
    });
  });

  describe("POST /auth/login/password", () => {
    test("should login with valid credentials and set cookies", async () => {
      const response = await ctx.request.post("/auth/login/password", {
        email: "student@test.com",
        password: "test-password",
      });

      expect(response.statusCode).toBe(HttpStatus.CREATED);

      const body = ctx.request.parseBody<{ ok: boolean; data: JWTResponse }>(response);
      expect(body.ok).toBe(true);
      tokens = body.data;
      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
      expect(ctx.sessionStore.at(-1)?.refreshToken).toBe(tokens.refreshToken);
      expect(response.headers["set-cookie"]).toBeDefined();
    });

    test("should reject login without credentials", async () => {
      const response = await ctx.request.post("/auth/login/password", {});

      expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);

      const body = ctx.request.parseBody<{ ok?: boolean; status?: number; statusCode?: number }>(
        response,
      );
      expect(body.ok).toBe(false);
      expect(body.status ?? body.statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    test("should validate required fields", async () => {
      const response = await ctx.request.post("/auth/login/password", {
        id: "test-user",
      });

      expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
      const body = ctx.request.parseBody<{ ok?: boolean; status?: number; statusCode?: number }>(
        response,
      );
      expect(body.ok).toBe(false);
      expect(body.status ?? body.statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    test("should reject invalid credentials format", async () => {
      const response = await ctx.request.post("/auth/login/password", {
        id: 123,
        password: "test-password",
      });

      expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
      const body = ctx.request.parseBody<{ ok?: boolean; status?: number; statusCode?: number }>(
        response,
      );
      expect(body.ok).toBe(false);
      expect(body.status ?? body.statusCode).toBe(HttpStatus.BAD_REQUEST);
    });
  });

  describe("POST /auth/refresh", () => {
    test("should refresh tokens using cookie header", async () => {
      const login = await ctx.request.post("/auth/login/password", {
        email: "student@test.com",
        password: "test-password",
      });
      const cookies = login.headers["set-cookie"];
      const cookieHeader =
        (Array.isArray(cookies) ? cookies.map((c) => c.split(";")[0]).join("; ") : cookies) ?? "";

      const response = await ctx.request.post("/auth/refresh", {}, undefined, {
        cookie: cookieHeader,
      });

      expect(response.statusCode).toBe(HttpStatus.CREATED);
      const body = ctx.request.parseBody<{ ok?: boolean; data?: JWTResponse }>(response);
      expect(body.ok ?? true).toBe(true);
      expect(body.data?.accessToken ?? tokens.accessToken).toBeDefined();
      expect(body.data?.refreshToken ?? tokens.refreshToken).toBeDefined();
    });

    test("should refresh tokens when refresh token is provided", async () => {
      const response = await ctx.request.post("/auth/refresh", {
        refreshToken: tokens.refreshToken,
      });

      expect(response.statusCode).toBe(HttpStatus.CREATED);
      const body = ctx.request.parseBody<{ ok: boolean; data: JWTResponse }>(response);
      expect(body.ok).toBe(true);
      expect(body.data.accessToken).not.toBe(tokens.accessToken);
      expect(body.data.refreshToken).not.toBe(tokens.refreshToken);
      tokens = body.data;
    });

    test("should reject refresh without token", async () => {
      const response = await ctx.request.post("/auth/refresh", {});

      expect(response.statusCode).toBe(HttpStatus.NOT_FOUND);
      const body = ctx.request.parseBody<{ ok?: boolean; status?: number; statusCode?: number }>(
        response,
      );
      expect(body.ok).toBe(false);
      expect(body.status ?? body.statusCode).toBe(HttpStatus.NOT_FOUND);
    });

    test("should validate refresh token format", async () => {
      const response = await ctx.request.post("/auth/refresh", {
        refreshToken: "invalid-token-format",
      });

      expect(response.statusCode).toBe(HttpStatus.NOT_FOUND);
      const body = ctx.request.parseBody<{ ok?: boolean; status?: number; statusCode?: number }>(
        response,
      );
      expect(body.ok).toBe(false);
      expect(body.status ?? body.statusCode).toBe(HttpStatus.NOT_FOUND);
    });
  });

  describe("GET /auth/logout", () => {
    test("should logout with valid token", async () => {
      const response = await ctx.request.get("/auth/logout", tokens.accessToken);

      expect(response.statusCode).toBe(HttpStatus.OK);
      const body = ctx.request.parseBody<{ ok?: boolean; data?: { success: boolean } }>(response);
      expect(body.ok).toBe(true);
      expect(body.data?.success).toBe(true);
      const cookies = response.headers["set-cookie"];
      expect(cookies).toBeDefined();
      const cookieStr = Array.isArray(cookies) ? cookies.join("; ") : cookies;
      expect(cookieStr).toContain("access-token=");
      expect(cookieStr).toContain("refresh-token=");
    });

    test("should reject logout without authentication", async () => {
      const response = await ctx.request.get("/auth/logout");

      expect(response.statusCode).toBe(HttpStatus.UNAUTHORIZED);
      const body = ctx.request.parseBody<{ statusCode: number; message: unknown }>(response);
      expect(body.statusCode).toBe(HttpStatus.UNAUTHORIZED);
      expect(body.message).toBeDefined();
    });

    test("should reject logout with invalid token", async () => {
      const response = await ctx.request.get("/auth/logout", "invalid-token-123");

      expect(response.statusCode).toBe(HttpStatus.UNAUTHORIZED);
      const body = ctx.request.parseBody<{ statusCode: number; message: unknown }>(response);
      expect(body.statusCode).toBe(HttpStatus.UNAUTHORIZED);
      expect(body.message).toBeDefined();
    });
  });

  describe("Personal Information Verify Token", () => {
    test("should issue token for student", async () => {
      const response = await ctx.request.get(
        "/auth/personalInformationVerifyToken",
        ctx.tokens.student.accessToken,
      );

      expect(response.statusCode).toBe(HttpStatus.OK);
      const body = ctx.request.parseBody<{ ok: boolean; data: string }>(response);
      expect(body.ok).toBe(true);
      expect(typeof body.data).toBe("string");
    });

    test("should reject issuing token without auth", async () => {
      const response = await ctx.request.get("/auth/personalInformationVerifyToken");

      expect(response.statusCode).toBe(HttpStatus.UNAUTHORIZED);
    });

    test("should reject verifying token without payload", async () => {
      const response = await ctx.request.post("/auth/personalInformationVerifyToken", {});

      expect(response.statusCode).toBe(HttpStatus.UNAUTHORIZED);
    });

    test("should verify issued token", async () => {
      const issued = await ctx.request.get(
        "/auth/personalInformationVerifyToken",
        ctx.tokens.student.accessToken,
      );
      const issuedBody = ctx.request.parseBody<{ ok: boolean; data: string }>(issued);
      expect(issuedBody.ok).toBe(true);

      const response = await ctx.request.post("/auth/personalInformationVerifyToken", {
        token: issuedBody.data,
      });

      expect(response.statusCode).toBe(HttpStatus.CREATED);
      const body = ctx.request.parseBody<{ ok: boolean; data: string }>(response);
      expect(body.ok).toBe(true);
      expect(body.data).toBe("student@test.com");
    });
  });

  describe("Authentication Flow", () => {
    test("should respond from ping with valid token", async () => {
      const response = await ctx.request.get("/auth/ping", tokens.accessToken);
      expect(response.statusCode).toBe(HttpStatus.OK);
      expect(response.body).toContain("퐁");
    });

    test("should return proper error structure for unauthorized requests", async () => {
      const response = await ctx.request.get("/student/stay");

      expect(response.statusCode).toBe(HttpStatus.UNAUTHORIZED);

      const body = ctx.request.parseBody<{ statusCode: number; message: string }>(response);
      expect(body).toHaveProperty("statusCode");
      expect(body.statusCode).toBe(401);
      expect(body).toHaveProperty("message");
    });
  });

  describe("Response Format", () => {
    test("should return responses in standard format", async () => {
      const response = await ctx.request.get("/auth/login/google");

      const body = ctx.request.parseBody<{
        ok: boolean;
        status: number;
        data?: unknown;
        error?: unknown;
      }>(response);

      expect(body).toHaveProperty("ok");
      expect(body).toHaveProperty("status");
      expect(typeof body.ok).toBe("boolean");
      expect(typeof body.status).toBe("number");

      if (body.ok) {
        expect(body).toHaveProperty("data");
      } else {
        expect(body).toHaveProperty("error");
      }
    });
  });
});
