import { mock } from "bun:test";
import type { ObjectLiteral, Repository } from "typeorm";

type QueryBuilder =
  ReturnType<typeof createMockRepository> extends { createQueryBuilder: () => infer QB }
    ? QB
    : never;

export const createMockRepository = <T extends ObjectLiteral = ObjectLiteral>(
  defaultData?: T | T[],
): Repository<T> => {
  const queryBuilder: Record<string, unknown> = {
    where: mock(function (this: QueryBuilder) {
      return this;
    }),
    andWhere: mock(function (this: QueryBuilder) {
      return this;
    }),
    orWhere: mock(function (this: QueryBuilder) {
      return this;
    }),
    innerJoin: mock(function (this: QueryBuilder) {
      return this;
    }),
    innerJoinAndSelect: mock(function (this: QueryBuilder) {
      return this;
    }),
    leftJoin: mock(function (this: QueryBuilder) {
      return this;
    }),
    leftJoinAndSelect: mock(function (this: QueryBuilder) {
      return this;
    }),
    select: mock(function (this: QueryBuilder) {
      return this;
    }),
    addSelect: mock(function (this: QueryBuilder) {
      return this;
    }),
    orderBy: mock(function (this: QueryBuilder) {
      return this;
    }),
    addOrderBy: mock(function (this: QueryBuilder) {
      return this;
    }),
    groupBy: mock(function (this: QueryBuilder) {
      return this;
    }),
    having: mock(function (this: QueryBuilder) {
      return this;
    }),
    skip: mock(function (this: QueryBuilder) {
      return this;
    }),
    take: mock(function (this: QueryBuilder) {
      return this;
    }),
    limit: mock(function (this: QueryBuilder) {
      return this;
    }),
    offset: mock(function (this: QueryBuilder) {
      return this;
    }),
    loadRelationIdAndMap: mock(function (this: QueryBuilder) {
      return this;
    }),
    getOne: mock(() => Promise.resolve(defaultData || null)),
    getMany: mock(() => Promise.resolve(Array.isArray(defaultData) ? defaultData : [])),
    getManyAndCount: mock(() =>
      Promise.resolve([
        Array.isArray(defaultData) ? defaultData : [],
        Array.isArray(defaultData) ? defaultData.length : 0,
      ]),
    ),
    getRawAndEntities: mock(() =>
      Promise.resolve({
        entities: Array.isArray(defaultData) ? defaultData : [],
        raw: [],
      }),
    ),
    getCount: mock(() => Promise.resolve(Array.isArray(defaultData) ? defaultData.length : 0)),
    execute: mock(() => Promise.resolve(undefined)),
    getRawOne: mock(() => Promise.resolve(defaultData || null)),
    getRawMany: mock(() => Promise.resolve(Array.isArray(defaultData) ? defaultData : [])),
    stream: mock(() => Promise.resolve(null)),
  };

  return {
    find: mock(() => Promise.resolve(Array.isArray(defaultData) ? defaultData : [])),
    findOne: mock(() => Promise.resolve(defaultData || null)),
    findOneBy: mock(() => Promise.resolve(defaultData || null)),
    findOneById: mock(() => Promise.resolve(defaultData || null)),
    findAndCount: mock(() =>
      Promise.resolve([
        Array.isArray(defaultData) ? defaultData : [],
        Array.isArray(defaultData) ? defaultData.length : 0,
      ]),
    ),
    findByIds: mock(() => Promise.resolve(Array.isArray(defaultData) ? defaultData : [])),
    findBy: mock(() => Promise.resolve(Array.isArray(defaultData) ? defaultData : [])),

    save: mock((entity) => Promise.resolve(entity)),
    create: mock((dto) => dto),
    insert: mock(() => Promise.resolve({ identifiers: [], generatedMaps: [], raw: [] })),
    update: mock(() => Promise.resolve({ affected: 1, raw: [], generatedMaps: [] })),
    delete: mock(() => Promise.resolve({ affected: 1, raw: [] })),
    remove: mock((entity) => Promise.resolve(entity)),
    softRemove: mock((entity) => Promise.resolve(entity)),
    softDelete: mock(() => Promise.resolve({ affected: 1, raw: [], generatedMaps: [] })),
    restore: mock(() => Promise.resolve({ affected: 1, raw: [], generatedMaps: [] })),
    recover: mock((entity) => Promise.resolve(entity)),

    count: mock(() => Promise.resolve(Array.isArray(defaultData) ? defaultData.length : 0)),
    countBy: mock(() => Promise.resolve(Array.isArray(defaultData) ? defaultData.length : 0)),

    exist: mock(() => Promise.resolve(!!defaultData)),
    existsBy: mock(() => Promise.resolve(!!defaultData)),

    preload: mock((entity) => Promise.resolve(entity)),
    clear: mock(() => Promise.resolve()),
    increment: mock(() => Promise.resolve({ affected: 1, raw: [], generatedMaps: [] })),
    decrement: mock(() => Promise.resolve({ affected: 1, raw: [], generatedMaps: [] })),

    createQueryBuilder: mock(() => queryBuilder),

    metadata: {
      columns: [],
      relations: [],
    },

    manager: {
      save: mock((entity) => Promise.resolve(entity)),
      remove: mock((entity) => Promise.resolve(entity)),
      transaction: mock((callback) => callback()),
    },
  } as unknown as Repository<T>;
};
