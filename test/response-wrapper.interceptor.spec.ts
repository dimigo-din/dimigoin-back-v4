import { describe, expect, test } from "bun:test";
import type { CallHandler, ExecutionContext } from "@nestjs/common";
import { firstValueFrom, of } from "rxjs";
import { ResponseWrapperInterceptor } from "$interceptors/response_wapper.service";

describe("ResponseWrapperInterceptor", () => {
  test("converts nested camelCase keys in response data to snake_case", async () => {
    const interceptor = new ResponseWrapperInterceptor();
    const context = {
      switchToHttp: () => ({
        getResponse: () => ({
          statusCode: 200,
          status: () => undefined,
        }),
        getRequest: () => ({
          url: "/student/stay",
          logger: {
            error: () => undefined,
          },
        }),
      }),
    } as unknown as ExecutionContext;

    const next = {
      handle: () =>
        of({
          staySeatPreset: {
            onlyReadingRoom: true,
            staySeat: [{ seatRange: "A1:A4" }],
          },
          stay_apply_period: [{ applyStart: "2026-02-23T00:00:00.000Z" }],
        }),
    } satisfies CallHandler;

    const result = await firstValueFrom(interceptor.intercept(context, next));

    expect(result).toEqual({
      ok: true,
      status: 200,
      data: {
        stay_seat_preset: {
          only_reading_room: true,
          stay_seat: [{ seat_range: "A1:A4" }],
        },
        stay_apply_period: [{ apply_start: "2026-02-23T00:00:00.000Z" }],
      },
    });
  });

  test("does not convert auth response keys", async () => {
    const interceptor = new ResponseWrapperInterceptor();
    const context = {
      switchToHttp: () => ({
        getResponse: () => ({
          statusCode: 201,
          status: () => undefined,
        }),
        getRequest: () => ({
          url: "/auth/login/password",
          logger: {
            error: () => undefined,
          },
        }),
      }),
    } as unknown as ExecutionContext;

    const next = {
      handle: () =>
        of({
          accessToken: "access-token",
          refreshToken: "refresh-token",
        }),
    } satisfies CallHandler;

    const result = await firstValueFrom(interceptor.intercept(context, next));

    expect(result).toEqual({
      ok: true,
      status: 201,
      data: {
        accessToken: "access-token",
        refreshToken: "refresh-token",
      },
    });
  });
});
