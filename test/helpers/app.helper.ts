import { mock } from "bun:test";
import fastifyCookie from "@fastify/cookie";
import fastifyMultipart from "@fastify/multipart";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Global, Module, ValidationPipe } from "@nestjs/common";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { Test, TestingModule } from "@nestjs/testing";
import { AppModule } from "#app/app.module";
import { createMockDrizzleDB } from "#test/mocks/repository";
import * as interceptors from "$/interceptors";
import { CacheService, CustomCacheModule } from "$modules/cache.module";
import { DRIZZLE, DrizzleModule } from "$modules/drizzle.module";

@Global()
@Module({
  providers: [{ provide: DRIZZLE, useValue: createMockDrizzleDB() }],
  exports: [DRIZZLE],
})
class MockDatabaseModule {}

@Global()
@Module({
  providers: [
    {
      provide: CACHE_MANAGER,
      useValue: {
        get: mock(async () => null),
        set: mock(async () => undefined),
        del: mock(async () => undefined),
        reset: mock(async () => undefined),
      },
    },
    {
      provide: CacheService,
      useValue: {
        musicSearchRateLimit: mock(async () => true),
        cacheSearchResults: mock(async () => undefined),
        getCachedVideo: mock(async () => null),
        getPersonalInformationVerifyTokenSecret: mock(async () => "mock-secret"),
        setCachedTimetable: mock(async () => undefined),
        getCachedTimetable: mock(async () => undefined),
        isNotificationAlreadySent: mock(async () => false),
      },
    },
  ],
  exports: [CACHE_MANAGER, CacheService],
})
class MockCacheModule {}

export class TestApp {
  private app: NestFastifyApplication;

  async initialize(): Promise<NestFastifyApplication> {
    const moduleFixtureBuilder = Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideModule(DrizzleModule)
      .useModule(MockDatabaseModule)
      .overrideModule(CustomCacheModule)
      .useModule(MockCacheModule);

    const moduleFixture: TestingModule = await moduleFixtureBuilder.compile();

    this.app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter({
        bodyLimit: 50 * 1024 * 1024, // 50MB
      }),
    );

    await this.app.register(fastifyCookie);
    await this.app.register(fastifyMultipart);

    this.app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
      }),
    );

    this.app.useGlobalInterceptors(...Object.values(interceptors).map((i) => new i()));

    await this.app.init();

    await this.app.getHttpAdapter().getInstance().ready();

    return this.app;
  }

  async close(): Promise<void> {
    if (this.app) {
      await this.app.close();
    }
  }

  getApp(): NestFastifyApplication {
    return this.app;
  }
}
