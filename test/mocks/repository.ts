import { mock } from "bun:test";
import type { DrizzleDB } from "$modules/drizzle.module";

export const createMockDrizzleDB = (): DrizzleDB => {
  const mockQuery: Record<string, unknown> = new Proxy(
    {},
    {
      get: () => ({
        findFirst: mock(async () => null),
        findMany: mock(async () => []),
      }),
    },
  );

  return {
    query: mockQuery,
    select: mock(() => ({
      from: mock(() => ({
        where: mock(() => ({
          limit: mock(async () => []),
          returning: mock(async () => []),
          execute: mock(async () => []),
        })),
        limit: mock(async () => []),
        leftJoin: mock(() => ({
          where: mock(() => ({
            groupBy: mock(async () => []),
          })),
        })),
        execute: mock(async () => []),
      })),
    })),
    insert: mock(() => ({
      values: mock(() => ({
        returning: mock(async () => [{}]),
        onConflictDoUpdate: mock(() => ({
          returning: mock(async () => [{}]),
        })),
      })),
    })),
    update: mock(() => ({
      set: mock(() => ({
        where: mock(() => ({
          returning: mock(async () => [{}]),
        })),
      })),
    })),
    delete: mock(() => ({
      where: mock(() => ({
        returning: mock(async () => [{}]),
      })),
    })),
    execute: mock(async () => []),
  } as unknown as DrizzleDB;
};
