import fastifyCookie from "@fastify/cookie";
import fastifyMultipart from "@fastify/multipart";
import { Module, ValidationPipe } from "@nestjs/common";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import importToArray from "import-to-array";
import { AppModule } from "@/app/app.module";
import * as interceptors from "@/common/interceptors";
import { CustomDatabaseModule } from "@/common/modules/database.module";
import * as entities from "@/schemas";
import { createMockRepository } from "../mocks/repository";

@Module({})
class MockDatabaseModule {}

export class TestApp {
  private app: NestFastifyApplication;

  async initialize(): Promise<NestFastifyApplication> {
    const moduleFixtureBuilder = Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideModule(CustomDatabaseModule)
      .useModule(MockDatabaseModule);

    const allEntities = importToArray(entities);
    for (const entity of allEntities) {
      moduleFixtureBuilder
        .overrideProvider(getRepositoryToken(entity))
        .useValue(createMockRepository());
    }

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

    this.app.useGlobalInterceptors(...importToArray(interceptors).map((i) => new i()));

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
