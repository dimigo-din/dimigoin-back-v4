import * as process from "node:process";

import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import importToArray from "import-to-array";

import { AppModule } from "../src/app";
import * as interceptors from "../src/common/interceptors";

let app: INestApplication;

export const getApp = async (): Promise<INestApplication> => {
  if (!app) {
    process.env.NODE_ENV = "test";

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalInterceptors(...importToArray(interceptors).map((i) => new i()));

    await app.init();
  }
  return app;
};

export const closeApp = async () => {
  if (app) {
    await app.close();
  }
};
