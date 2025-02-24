import type { MiddlewareConsumer, NestModule } from "@nestjs/common";

import { Module } from "@nestjs/common";
import importToArray from "import-to-array";
import * as moment from "moment-timezone";

import { CustomLoggerMiddleware } from "src/common/middlewares";
import { CustomEssentialModules } from "src/common/modules";

import { AuthModule } from "src/auth";

import * as routes from "src/routes";

import { AppService } from "./app.service";

@Module({
  imports: [...CustomEssentialModules, AuthModule, ...importToArray(routes)],
  providers: [AppService],
})
export class AppModule implements NestModule {
  constructor() {
    moment.tz.setDefault("Asia/Seoul");
  }

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CustomLoggerMiddleware).forRoutes("*");
  }
}
