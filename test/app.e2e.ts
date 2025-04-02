import * as process from "node:process";

import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";

import { AppModule } from "../src/app";

let app: INestApplication;

export const getApp = async (): Promise<INestApplication> => {
  if (!app) {
    process.env.NODE_ENV = "test";

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  }
  return app;
};

export const closeApp = async () => {
  if (app) {
    await app.close();
  }
};
